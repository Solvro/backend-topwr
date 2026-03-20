import { ExtendedMap } from "@solvro/utils/map";
import assert from "node:assert";
import * as fs from "node:fs";

import { flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import db from "@adonisjs/lucid/services/db";
import { LucidModel } from "@adonisjs/lucid/types/model";

import BaseCommandExtended from "#commands/base_command_extended";
import { getMorphMapAlias } from "#utils/permissions";

export default class PermissionsCleanup extends BaseCommandExtended {
  static commandName = "permissions:cleanup";
  static description =
    "Removes orphaned ACL rows (permissions, access_roles, model_roles, model_permissions) " +
    "that reference deleted model instances. Scans all models with a morph map and deletes " +
    "rows whose entity_id/model_id no longer corresponds to an existing record.";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    description:
      "Run cleanup without asking for confirmation. Uses default (agreement) values for all prompts",
  })
  declare force: boolean;

  async run() {
    if (this.force) {
      this.autoUseDefaultPromptValues();
    }

    const tasks = this.ui.tasks({ verbose: true });
    tasks.add("Permission cleanup", async (task) => {
      try {
        return ((await this.runInternal(task)) as string | undefined) ?? "Done";
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Unknown error occurred";
        return task.error(`Permission cleanup failed: ${message}`);
      }
    });
    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }

  private async runInternal(
    task: Parameters<Parameters<ReturnType<typeof this.ui.tasks>["add"]>[1]>[0],
  ) {
    // Stage 1: Discover ACL-enabled models
    task.update("Stage 1 - Discovering ACL-enabled models");
    const models = await this.importModels();
    const aclModels: { model: LucidModel; alias: string }[] = [];
    for (const model of models) {
      if (!model.booted) {
        model.boot();
      }
      const alias = getMorphMapAlias(model);
      if (alias !== null) {
        aclModels.push({ model, alias });
      }
    }
    task.update(
      `Found ${aclModels.length} ACL-enabled model(s): ${aclModels.map((m) => m.alias).join(", ")}`,
    );

    // Stage 2: Collect primary-key IDs of orphaned ACL rows (snapshot)
    //
    // We snapshot the exact IDs *before* asking for confirmation so that
    // stage 3 deletes only what the user agreed to — no TOCTOU surprises.
    task.update("Stage 2 - Collecting orphaned ACL row IDs");

    const ENTITY_TABLES = ["permissions", "access_roles"] as const;
    const MODEL_TABLES = ["model_roles", "model_permissions"] as const;

    // table → collected row IDs to delete
    const pendingDeletes = new ExtendedMap<string, number[]>();
    // alias → count (for the user-facing report)
    const orphanReport = new ExtendedMap<string, number>();
    let totalOrphans = 0;

    const appendIds = (table: string, alias: string, ids: number[]) => {
      if (ids.length === 0) {
        return;
      }
      pendingDeletes.getOrInsert(table, []).push(...ids);
      orphanReport.update(alias, (count) => (count ?? 0) + ids.length);
      totalOrphans += ids.length;
    };

    const rowIds = (rows: unknown[]): number[] =>
      (rows as { id: number | string }[]).map((r) => Number(r.id));

    // Known models
    for (const { model, alias } of aclModels) {
      const existingIdSubquery = db.from(model.table).select(model.primaryKey);

      for (const tbl of ENTITY_TABLES) {
        appendIds(
          tbl,
          alias,
          rowIds(
            await db
              .from(tbl)
              .where("entity_type", alias)
              .whereNotNull("entity_id")
              .whereNotIn("entity_id", existingIdSubquery)
              .select("id"),
          ),
        );
      }
      for (const tbl of MODEL_TABLES) {
        appendIds(
          tbl,
          alias,
          rowIds(
            await db
              .from(tbl)
              .where("model_type", alias)
              .whereNotIn("model_id", existingIdSubquery)
              .select("id"),
          ),
        );
      }
    }

    // Unknown entity/model types (not registered in any morph map)
    const knownArr = [...new Set(aclModels.map((m) => m.alias))];

    for (const tbl of ENTITY_TABLES) {
      let q = db
        .from(tbl)
        .whereNot("entity_type", "*")
        .whereNotNull("entity_id");
      if (knownArr.length > 0) {
        q = q.whereNotIn("entity_type", knownArr);
      }
      appendIds(tbl, "<unknown>", rowIds(await q.select("id")));
    }
    for (const tbl of MODEL_TABLES) {
      let q = db.from(tbl).whereNot("model_type", "*");
      if (knownArr.length > 0) {
        q = q.whereNotIn("model_type", knownArr);
      }
      appendIds(tbl, "<unknown>", rowIds(await q.select("id")));
    }

    if (totalOrphans === 0) {
      return "No orphaned ACL rows found. Database is clean!";
    }

    // Report findings
    task.update(`Found ${totalOrphans} orphaned ACL row(s) total`);
    for (const [alias, count] of orphanReport) {
      this.logger.info(`  ${alias}: ${count} orphaned row(s)`);
    }

    // Stage 3: Confirm and delete by collected IDs
    const proceed = await this.prompt.confirm(
      `Delete ${totalOrphans} orphaned ACL row(s)?`,
      { default: true },
    );
    if (!proceed) {
      return "Cleanup cancelled by user";
    }

    task.update("Stage 3 - Deleting orphaned ACL rows");
    let deletedTotal = 0;

    for (const [table, ids] of pendingDeletes) {
      const deleted = Number(await db.from(table).whereIn("id", ids).delete());
      this.logger.info(`  ${table}: deleted ${deleted} row(s)`);
      deletedTotal += deleted;
    }

    if (deletedTotal !== totalOrphans) {
      const diff = deletedTotal - totalOrphans;
      this.logger.warning(
        `  Deleted ${Math.abs(diff)} ${diff < 0 ? "less" : "more"} row(s) than expected!`,
      );
    }

    return `Cleanup complete. Deleted ${deletedTotal} orphaned ACL row(s).`;
  }

  private async importModels(): Promise<LucidModel[]> {
    const models: LucidModel[] = [];
    for (const file of fs.readdirSync(this.app.modelsPath())) {
      if (![".js", ".ts"].some((ext) => file.endsWith(ext))) {
        continue;
      }
      const imported = (await import(
        `#models/${file.substring(0, file.length - 3)}`
      )) as { default: LucidModel };
      models.push(imported.default);
    }
    assert(models.length > 0, "No models found in app/models");
    return models;
  }
}
