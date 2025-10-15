import { toIBaseError } from "@solvro/error-handling/base";
import {
  analyzeErrorStack,
  prepareReportForLogging,
} from "@solvro/error-handling/reporting";
import assert from "node:assert";
import * as fs from "node:fs";
import path from "node:path";

import { flags } from "@adonisjs/core/ace";
import router from "@adonisjs/core/services/router";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { LucidModel, LucidRow } from "@adonisjs/lucid/types/model";
import { Dictionary } from "@adonisjs/lucid/types/querybuilder";

import BaseCommandExtended from "#commands/base_command_extended";
import { TaskHandle } from "#commands/db_scrape";
import { MINIATURES_STORAGE_PATH, STORAGE_PATH } from "#config/drive";
import { ValidatedColumnDef } from "#decorators/typed_model";
import FileEntry from "#models/file_entry";

interface DbFileEntry {
  uuid: string;
  createdAt: number;
}

interface MiniatureEntry {
  uuid: string;
  ext: string;
}

interface LocalFileEntry extends MiniatureEntry {
  createdAt: number;
}

interface DBRelation {
  model: LucidModel;
  column: string;
  isNullable: boolean;
}

interface DBUsedFiles {
  uuids: (string | null)[];
  relationData: DBRelation;
}

const TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 1 day; anything newer than this will not get indexed

export default class CleanupFiles extends BaseCommandExtended {
  static commandName = "file_cleanup";
  static description = `Runs a script that will remove unused, orphaned and ghost files from the database and local storage. Only affects files older than ${TIME_LIMIT_MS} ms.`;

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    description:
      "Run all cleanup stages without asking. Use default values for all prompts",
  })
  declare force: boolean;

  private storagePath: string = STORAGE_PATH;
  private miniaturesStoragePath: string = MINIATURES_STORAGE_PATH;

  async run() {
    if (this.force) {
      this.enableForcePromptAgreement();
    }
    if (!router.commited) {
      router.commit();
    }
    const tasks = this.ui.tasks({ verbose: true });
    tasks.add("File cleanup", async (task) => {
      try {
        return ((await this.runInternal(task)) as string | undefined) ?? "Done";
      } catch (e) {
        const report = analyzeErrorStack(toIBaseError(e));
        const errorString = prepareReportForLogging(report, {
          includeCodeAndStatus: false,
        }).replaceAll("\n", "\n│ ");
        return task.error(
          `File cleanup run() method threw an error: ${errorString}`,
        );
      }
    });
    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }

  private async promptForDirectory(
    domain: string,
    defaultOption: string,
  ): Promise<string | undefined> {
    const defaultOptionPrompt = `Default: ${defaultOption}`;
    const storagePrompt = await this.prompt.choice(
      `Choose storage directory for ${domain}`,
      [defaultOptionPrompt, "Custom"],
      { default: defaultOption },
    );
    if (storagePrompt === "Custom") {
      const customOption = await this.prompt.ask(
        `Enter custom storage directory for ${domain} (or nothing for default):`,
        { default: defaultOption },
      );
      return this.checkIfValidDir(customOption) ? customOption : undefined;
    }
    return defaultOption;
  }

  private async runInternal(task: TaskHandle) {
    task.update("Stage 1 - Fetching files from local storage");
    const inputStoragePath = await this.promptForDirectory(
      "local files",
      STORAGE_PATH,
    );
    if (inputStoragePath === undefined) {
      return task.error("Provided storage path is not a valid directory.");
    }
    this.storagePath = inputStoragePath;
    const inputMiniaturesStoragePath = await this.promptForDirectory(
      "miniatures",
      MINIATURES_STORAGE_PATH,
    );
    if (inputMiniaturesStoragePath === undefined) {
      return task.error(
        "Provided miniatures storage path is not a valid directory.",
      );
    }
    this.miniaturesStoragePath = inputMiniaturesStoragePath;
    task.update(`Will register files under path: ${this.storagePath}`);
    task.update(
      `Will register miniatures under path: ${this.miniaturesStoragePath}`,
    );
    task.update("Collecting files...");
    const localFiles = this.getValidFiles();
    task.update(`Found ${localFiles.length} valid files on local disk`);
    const miniatureFiles = this.getValidMiniatures();
    task.update(
      `Found ${miniatureFiles.length} valid miniature files on local disk`,
    );

    // ----
    task.update("Stage 2 - Fetching files from FileEntries table");
    const fetchedFileEntries = await FileEntry.all();
    const dbFileEntry: DbFileEntry[] = fetchedFileEntries.map((row) => ({
      uuid: row.id,
      createdAt: row.createdAt.toMillis(),
    }));
    task.update(`Found ${dbFileEntry.length} files in the FileEntry table`);
    // ----
    task.update("Stage 3 - Looking for models with relations to FileEntry");
    const relations: DBRelation[] = [];
    const models = await this.importModels();
    if (!FileEntry.booted) {
      FileEntry.boot();
    }
    for (const model of models) {
      if (!model.booted) {
        model.boot();
      }
    }
    for (const model of models) {
      await this.addFileEntryRelationData(relations, model);
    }
    task.update(`Found ${relations.length} related models`);
    await this.askForListing(
      "List all related models with relation keys?",
      relations.map(
        (relation) => `${relation.model.name} - ${relation.column}`,
      ),
    );
    // ----
    task.update("Stage 4 - indexing files used by the related models");
    const usedFiles: DBUsedFiles[] = [];
    for (const relation of relations) {
      const result = await relation.model
        .query()
        .select(relation.column)
        .exec();
      const key = relation.column as keyof LucidRow;
      const uuids = result.map((row) => row[key]);
      usedFiles.push({
        relationData: relation,
        uuids,
      } as DBUsedFiles);
    }
    // ----
    task.update("Stage 5 - comparison preparations");
    const localSet: Set<string> = new Set<string>(
      localFiles.map((file) => file.uuid),
    );
    const miniatureSet: Set<string> = new Set<string>(
      miniatureFiles.map((file) => file.uuid),
    );
    const fileEntrySet: Set<string> = new Set<string>(
      dbFileEntry.map((file) => file.uuid),
    );
    const modelSet: Set<string> = new Set<string>(
      usedFiles.flatMap((file) => file.uuids.filter((uuid) => uuid !== null)),
    );
    // ignore any new files
    const bound = Date.now() - TIME_LIMIT_MS;
    for (const file of localFiles) {
      if (file.createdAt > bound) {
        localSet.delete(file.uuid);
        fileEntrySet.delete(file.uuid);
        modelSet.delete(file.uuid);
        // Assuming the lifetime of a miniature is tied to the lifetime of the file, we should ignore it as well - worst case, it can be recomputed
        miniatureSet.delete(file.uuid);
      }
    }
    for (const file of dbFileEntry) {
      if (file.createdAt > bound) {
        fileEntrySet.delete(file.uuid);
        localSet.delete(file.uuid);
        modelSet.delete(file.uuid);
        miniatureSet.delete(file.uuid);
      }
    }
    // ----
    task.update("Stage 6 - orphaned files");
    const orphanedFiles = localSet.difference(fileEntrySet);
    if (orphanedFiles.size === 0) {
      task.update(`No orphaned files found`);
    } else {
      task.update(`Found ${orphanedFiles.size} orphaned files`);
      await this.askForListing("List all orphaned files' ids?", orphanedFiles);
      const orphanedConfirmation = await this.prompt.confirm(
        "Delete all orphaned files from the file system?",
        { default: this.force },
      );
      if (orphanedConfirmation) {
        await this.removeOrphanedFiles(
          task,
          orphanedFiles,
          localFiles,
          localSet,
        );
      } else {
        task.update(`Skipping deletion of orphaned files`);
      }
    }

    // ----
    task.update("Stage 7 - unused files");
    const unusedFiles = fileEntrySet.difference(modelSet);
    if (unusedFiles.size === 0) {
      task.update(`No unused files found`);
    } else {
      task.update(`Found ${unusedFiles.size} unused files`);
      await this.askForListing("List all unused files' ids?", unusedFiles);
      const unusedConfirmation = await this.prompt.confirm(
        "Delete all unused files from the file system and the database?",
        { default: this.force },
      );
      if (unusedConfirmation) {
        await this.removeUnusedFiles(task, unusedFiles, localFiles, localSet);
      } else {
        task.update(`Skipping deletion of unused files`);
      }
    }

    // ----
    task.update("Stage 8 - ghost files");
    const ghostFiles = fileEntrySet.difference(localSet);
    if (ghostFiles.size === 0) {
      task.update(`No ghost files found`);
    } else {
      task.update(`Found ${ghostFiles.size} ghost files`);
      await this.askForListing("List all ghost files' ids?", ghostFiles);
      const ghostConfirmation = await this.prompt.confirm(
        "For all nullable references: Replace all ghost files references with null and delete them from FileEntry table?",
        { default: this.force },
      );
      if (ghostConfirmation) {
        await this.removeGhostFiles(task, usedFiles, ghostFiles);
      } else {
        task.update(`Skipping ghost file cleanup`);
      }
    }
    // ----
    task.update("Stage 9 - orphaned miniatures");
    const orphanedMiniatures = miniatureSet.difference(localSet);
    if (orphanedMiniatures.size === 0) {
      task.update(`No orphaned miniatures found`);
    } else {
      task.update(`Found ${orphanedMiniatures.size} orphaned miniatures`);
      await this.askForListing(
        "List all orphaned miniatures' ids?",
        orphanedMiniatures,
      );
      const miniatureConfirmation = await this.prompt.confirm(
        "Delete all orphaned miniatures from the file system?",
        { default: this.force },
      );
      if (miniatureConfirmation) {
        await this.removeOrphanedMiniatures(task, miniatureSet, miniatureFiles);
      } else {
        task.update(`Skipping orphaned miniatures cleanup`);
      }
    }
  }

  private async importModels(): Promise<LucidModel[]> {
    const models: LucidModel[] = [];
    for (const file of fs.readdirSync(this.app.modelsPath())) {
      if (![".js", ".ts"].some((ext) => file.endsWith(ext))) {
        // not a js/ts file
        continue;
      }
      const imported = (await import(
        `#models/${file.substring(0, file.length - 3)}`
      )) as { default: LucidModel };
      const defaultExport = imported.default;
      if (defaultExport !== FileEntry) {
        models.push(defaultExport);
      }
    }
    assert(models.length > 0, "No models found in app/models");
    return models;
  }

  private async addFileEntryRelationData(
    relations: DBRelation[],
    model: LucidModel,
  ) {
    model.$relationsDefinitions.forEach((relation) => {
      if (relation.type !== "belongsTo") {
        return;
      }
      if (!relation.booted) {
        relation.boot();
      }
      if (relation.relatedModel() === FileEntry) {
        const relationKey = relation.foreignKey;
        const column = model.$getColumn(relationKey);
        assert(column !== undefined);
        const castColumn = column as ValidatedColumnDef;
        relations.push({
          model,
          column: relationKey,
          isNullable: castColumn.meta.typing.optional,
        });
      }
    });
  }

  private removeFromDisk(entry: LocalFileEntry) {
    const key = `${entry.uuid}${entry.ext}`;
    // Miniature first in case of a failure as it can be recomputed
    fs.rmSync(path.join(this.miniaturesStoragePath, key));
    fs.rmSync(path.join(this.storagePath, key));
  }

  private async removeOrphanedFiles(
    task: TaskHandle,
    orphanedFiles: Set<string>,
    localFiles: LocalFileEntry[],
    localSet: Set<string>,
  ) {
    const size = orphanedFiles.size;
    task.update(`Attempting to delete ${size} orphaned files...`);
    // Remove from filesystem
    localFiles
      .filter((file) => orphanedFiles.has(file.uuid))
      .forEach((file) => {
        try {
          this.removeFromDisk(file);
          orphanedFiles.delete(file.uuid);
          localSet.delete(file.uuid);
        } catch (e) {
          this.logger.warning(
            `Failed to delete file ${file.uuid}${file.ext} from the file system: ${e}`,
          );
        }
      });
    task.update(`Deleted ${size - orphanedFiles.size} orphaned files`);
  }

  private async removeOrphanedMiniatures(
    task: TaskHandle,
    orphanedMiniatures: Set<string>,
    miniatureFiles: MiniatureEntry[],
  ) {
    const size = orphanedMiniatures.size;
    task.update(`Attempting to delete ${size} orphaned miniatures...`);
    // Remove miniature from filesystem
    miniatureFiles
      .filter((file) => orphanedMiniatures.has(file.uuid))
      .forEach((file) => {
        try {
          fs.rmSync(
            path.join(this.miniaturesStoragePath, `${file.uuid}${file.ext}`),
          );
          orphanedMiniatures.delete(file.uuid);
        } catch (e) {
          this.logger.warning(
            `Failed to delete miniature ${file.uuid}${file.ext} from the file system: ${e}`,
          );
        }
      });
    task.update(
      `Deleted ${size - orphanedMiniatures.size} orphaned miniatures`,
    );
  }

  private async removeUnusedFiles(
    task: TaskHandle,
    unusedFiles: Set<string>,
    localFiles: LocalFileEntry[],
    localSet: Set<string>,
  ) {
    const size = unusedFiles.size;
    task.update(`Attempting to delete ${size} unused files...`);
    // Remove from database
    await FileEntry.query()
      .delete()
      .whereIn("id", [...unusedFiles])
      .exec();
    // Remove from filesystem
    localFiles
      .filter((file) => unusedFiles.has(file.uuid))
      .forEach((file) => {
        try {
          this.removeFromDisk(file);
          unusedFiles.delete(file.uuid);
          localSet.delete(file.uuid);
        } catch (e) {
          this.logger.warning(
            `Failed to delete file ${file.uuid}${file.ext} from the file system: ${e}`,
          );
        }
      });
    task.update(`Deleted ${size - unusedFiles.size} unused files`);
  }

  private async removeGhostFiles(
    task: TaskHandle,
    usedFiles: DBUsedFiles[],
    ghostFiles: Set<string>,
  ) {
    const untouchableIds = new Set<string>();
    const removedIds = await Promise.all(
      usedFiles.map(async (collection) => {
        const toNull = collection.uuids
          .filter((uuid) => uuid !== null)
          .filter((uuid) => ghostFiles.has(uuid));
        if (!collection.relationData.isNullable) {
          // We cannot touch this model
          this.logger.info(
            `Skipped model ${collection.relationData.model.name} - relation is not nullable`,
          );
          toNull.forEach((uuid) => untouchableIds.add(uuid));
          return null;
        }
        if (toNull.length === 0) {
          this.logger.info(
            `Skipped model ${collection.relationData.model.name} - no valid values found`,
          );
          return null; // Nothing was removed
        }
        const column = collection.relationData.column;
        // Remove from the model table
        const values: Dictionary<unknown> = {};
        values[column] = null;
        await collection.relationData.model
          .query()
          .whereIn(column, toNull)
          .update(values)
          .exec();
        this.logger.info(
          `Set ${toNull.length} references to null for ${collection.relationData.model.name}`,
        );
        return toNull;
      }),
    ).then((values) => values.filter((value) => value !== null).flat());
    task.update(`Set ${removedIds.length} references to null in models`);
    // Get the Ids that can have their File entries deleted
    const safeToNullIds = removedIds.filter((id) => !untouchableIds.has(id));
    // Remove from the FileEntry table
    await FileEntry.query().delete().whereIn("id", safeToNullIds).exec();
    task.update(
      `Removed ${safeToNullIds.length} entries from the FileEntry table.`,
    );
  }

  private checkIfValidDir(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private static getUuidRegex(): RegExp {
    return /^[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}$/i;
  }

  //Filter out only files that have valid UUIDs as filenames
  private getValidFiles(): LocalFileEntry[] {
    const uuidRegex = CleanupFiles.getUuidRegex();
    const filenames = fs.readdirSync(this.storagePath);
    return filenames
      .map((filename) => {
        const filePath = path.join(this.storagePath, filename);
        const stats = fs.statSync(filePath);
        return { ...path.parse(filePath), createdAt: stats.birthtimeMs };
      })
      .filter((pathObj) => uuidRegex.test(pathObj.name))
      .map((pathObj) => ({
        uuid: pathObj.name,
        ext: pathObj.ext,
        createdAt: pathObj.createdAt,
      }));
  }

  //Filter out only files that have valid UUIDs as filenames
  private getValidMiniatures(): MiniatureEntry[] {
    const uuidRegex = CleanupFiles.getUuidRegex();
    const filenames = fs.readdirSync(this.miniaturesStoragePath);
    return filenames
      .map((filename) => path.parse(path.join(this.storagePath, filename)))
      .filter((pathObj) => uuidRegex.test(pathObj.name))
      .map((pathObj) => ({
        uuid: pathObj.name,
        ext: pathObj.ext,
      }));
  }
}
