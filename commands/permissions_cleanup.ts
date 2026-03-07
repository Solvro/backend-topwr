import assert from "node:assert";
import * as fs from "node:fs";

import { flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import db from "@adonisjs/lucid/services/db";
import { LucidModel } from "@adonisjs/lucid/types/model";

import BaseCommandExtended from "#commands/base_command_extended";
import {
  deleteOrphanedPermissionsForModel,
  getMorphMapAlias,
} from "#utils/permissions";

export default class PermissionsCleanup extends BaseCommandExtended {
  static commandName = "permissions:cleanup";
  static description =
    "Removes orphaned permissions that reference deleted model instances. " +
    "Scans all models with a morph map and deletes permission rows whose entity_id " +
    "no longer corresponds to an existing record.";

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

    // Stage 2: Count orphaned permissions per model
    task.update("Stage 2 - Scanning for orphaned permissions");
    const orphanReport: {
      model: LucidModel;
      alias: string;
      orphanCount: number;
    }[] = [];
    let totalOrphans = 0;

    for (const { model, alias } of aclModels) {
      const table = model.table;
      const primaryKey = model.primaryKey;

      const existingRows = (await db.from(table).select(primaryKey)) as Record<
        string,
        unknown
      >[];
      const existingIds = existingRows.map((row) => row[primaryKey] as number);

      let countQuery = db
        .from("permissions")
        .where("entity_type", alias)
        .whereNotNull("entity_id");
      if (existingIds.length > 0) {
        countQuery = countQuery.whereNotIn("entity_id", existingIds);
      }
      const result = await countQuery.count("* as count");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- knex aggregate result
      const count = Number(result[0]?.count ?? 0);
      if (count > 0) {
        orphanReport.push({ model, alias, orphanCount: count });
        totalOrphans += count;
      }
    }

    // Also check for permissions referencing entity_types that no longer exist in any morph map
    const knownAliases = new Set(aclModels.map((m) => m.alias));
    const allEntityTypes = await db
      .from("permissions")
      .whereNot("entity_type", "*")
      .whereNotNull("entity_id")
      .distinct("entity_type");

    const unknownEntityTypes: string[] = [];
    for (const row of allEntityTypes) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- knex raw result
      const entityType = row.entity_type as string;
      if (!knownAliases.has(entityType)) {
        unknownEntityTypes.push(entityType);
      }
    }

    let unknownOrphanCount = 0;
    if (unknownEntityTypes.length > 0) {
      const result = await db
        .from("permissions")
        .whereIn("entity_type", unknownEntityTypes)
        .whereNotNull("entity_id")
        .count("* as count");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- knex aggregate result
      unknownOrphanCount = Number(result[0]?.count ?? 0);
      totalOrphans += unknownOrphanCount;
    }

    if (totalOrphans === 0) {
      return "No orphaned permissions found. Database is clean!";
    }

    // Report findings
    task.update(`Found ${totalOrphans} orphaned permission(s) total`);
    for (const { alias, orphanCount } of orphanReport) {
      this.logger.info(`  ${alias}: ${orphanCount} orphaned permission(s)`);
    }
    if (unknownOrphanCount > 0) {
      this.logger.info(
        `  Unknown entity types (${unknownEntityTypes.join(", ")}): ${unknownOrphanCount} orphaned permission(s)`,
      );
    }

    // Stage 3: Confirm and delete
    const proceed = await this.prompt.confirm(
      `Delete ${totalOrphans} orphaned permission(s)?`,
      { default: true },
    );
    if (!proceed) {
      return "Cleanup cancelled by user";
    }

    task.update("Stage 3 - Deleting orphaned permissions");
    let deletedTotal = 0;

    for (const { model, alias } of orphanReport) {
      const deleted = await deleteOrphanedPermissionsForModel(model);
      this.logger.info(`  Deleted ${deleted} permission(s) for ${alias}`);
      deletedTotal += deleted;
    }

    // Delete permissions for unknown entity types
    if (unknownOrphanCount > 0) {
      const result = await db
        .from("permissions")
        .whereIn("entity_type", unknownEntityTypes)
        .whereNotNull("entity_id")
        .delete();
      const deleted = Number(result);
      this.logger.info(
        `  Deleted ${deleted} permission(s) for unknown entity types`,
      );
      deletedTotal += deleted;
    }

    return `Cleanup complete. Deleted ${deletedTotal} orphaned permission(s).`;
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
