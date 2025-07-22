import assert from "node:assert";
import * as fs from "node:fs";
import path from "node:path";

import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { LucidModel, LucidRow } from "@adonisjs/lucid/types/model";
import { Dictionary } from "@adonisjs/lucid/types/querybuilder";

import { TaskHandle } from "#commands/db_scrape";
import { ValidatedColumnDef } from "#decorators/typed_model";
import {
  analyzeErrorStack,
  prepareReportForLogging,
  toIBaseError,
} from "#exceptions/base_error";
import FileEntry from "#models/file_entry";

interface LocalFileEntry {
  uuid: string;
  ext: string;
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

const DEFAULT_FILE_PATH = path.resolve(".", "storage");
const MODEL_DIR_PATH = path.resolve(".", "app", "models");

export default class CleanupFiles extends BaseCommand {
  static commandName = "file_cleanup";
  static description =
    "Runs a script that will remove unused, orphaned and ghost files from the database and local storage";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
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

  private async runInternal(task: TaskHandle) {
    task.update("Stage 1 - Fetching files from local storage");
    let storagePath = DEFAULT_FILE_PATH;
    const defaultOption = `Default: ${DEFAULT_FILE_PATH}`;
    const storagePrompt = await this.prompt.choice(
      "Choose local storage directory",
      [defaultOption, "Custom"],
      { default: defaultOption },
    );
    if (storagePrompt === "Custom") {
      const customOption = await this.prompt.ask(
        "Enter custom local storage directory (or nothing for default):",
        { default: DEFAULT_FILE_PATH },
      );
      if (!this.checkIfValidDir(customOption)) {
        return task.error("The provided path is not a valid directory");
      }
      storagePath = customOption;
    }
    task.update(`Will register files under path: ${storagePath}`);
    task.update("Collecting files...");
    const localFiles = this.getValidFiles(storagePath);
    task.update(`Found ${localFiles.length} valid files on local disk`);
    // ----
    task.update("Stage 2 - Fetching files from FileEntries table");
    const fetchedFileEntries = await FileEntry.all();
    const dbFileEntry = fetchedFileEntries.map((row) => row.id);
    task.update(`Found ${dbFileEntry.length} files in the FileEntry table`);
    // ----
    task.update("Stage 3 - Looking for models with relations to FileEntry");
    const relations: DBRelation[] = [];
    const models = await this.importModels();
    if (!FileEntry.booted) {
      FileEntry.boot();
    }
    for (const model of Object.values(models)) {
      if (!model.booted) {
        model.boot();
      }
    }
    for (const model of Object.values(models)) {
      await this.addFileEntryRelationData(relations, model);
    }
    task.update(`Found ${relations.length} related models`);
    await this.askForListing(
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
    const fileEntrySet: Set<string> = new Set<string>(dbFileEntry);
    const modelSet: Set<string> = new Set<string>(
      usedFiles.flatMap((file) => file.uuids.filter((uuid) => uuid !== null)),
    );
    // ----
    task.update("Stage 6 - orphaned files");
    const orphanedFiles = localSet.difference(fileEntrySet);
    if (orphanedFiles.size === 0) {
      task.update(`No orphaned files found`);
    } else {
      task.update(`Found ${orphanedFiles.size} orphaned files`);
      await this.askForListing(orphanedFiles);
      const orphanedConfirmation = await this.prompt.confirm(
        "Delete all orphaned files from the file system?",
        { default: false },
      );
      if (orphanedConfirmation) {
        await this.removeOrphanedFiles(
          task,
          orphanedFiles,
          localFiles,
          storagePath,
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
      await this.askForListing(unusedFiles);
      const unusedConfirmation = await this.prompt.confirm(
        "Delete all unused files from the file system and the database?",
        { default: false },
      );
      if (unusedConfirmation) {
        await this.removeUnusedFiles(
          task,
          unusedFiles,
          localFiles,
          localSet,
          storagePath,
        );
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
      await this.askForListing(ghostFiles);
      const ghostConfirmation = await this.prompt.confirm(
        "For all nullable references: Replace all ghost files references with null and delete them from FileEntry table?",
        { default: false },
      );
      if (ghostConfirmation) {
        await this.removeGhostFiles(task, usedFiles, ghostFiles);
      } else {
        task.update(`Skipping ghost file cleanup`);
      }
    }
  }

  private async importModels(): Promise<LucidModel[]> {
    const models: LucidModel[] = [];
    for (const file of fs.readdirSync(MODEL_DIR_PATH)) {
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

  private async removeOrphanedFiles(
    task: TaskHandle,
    orphanedFiles: Set<string>,
    localFiles: LocalFileEntry[],
    storagePath: string,
    localSet: Set<string>,
  ) {
    const size = orphanedFiles.size;
    task.update(`Attempting to delete ${size} orphaned files...`);
    // Remove from filesystem
    localFiles
      .filter((file) => orphanedFiles.has(file.uuid))
      .forEach((file) => {
        try {
          fs.rmSync(path.join(storagePath, `${file.uuid}.${file.ext}`), {
            force: true,
          });
          orphanedFiles.delete(file.uuid);
          localSet.delete(file.uuid);
        } catch (e) {
          this.logger.warning(
            `Failed to delete file ${file.uuid}.${file.ext} from the file system: ${e}`,
          );
        }
      });
    task.update(`Deleted ${size - orphanedFiles.size} orphaned files`);
  }

  private async removeUnusedFiles(
    task: TaskHandle,
    unusedFiles: Set<string>,
    localFiles: LocalFileEntry[],
    localSet: Set<string>,
    storagePath: string,
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
          fs.rmSync(path.join(storagePath, `${file.uuid}.${file.ext}`), {
            force: true,
          });
          unusedFiles.delete(file.uuid);
          localSet.delete(file.uuid);
        } catch (e) {
          this.logger.warning(
            `Failed to delete file ${file.uuid}.${file.ext} from the file system: ${e}`,
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
    const applicable = usedFiles.filter(
      (collection) => collection.relationData.isNullable,
    );
    task.update(
      `${applicable.length} models with nullable references to FileEntry found. Setting references to null...`,
    );
    await Promise.all(
      applicable.map(async (collection) => {
        const toNull = collection.uuids
          .filter((uuid) => uuid !== null)
          .filter((uuid) => ghostFiles.has(uuid));
        if (toNull.length === 0) {
          this.logger.info(
            `Skipped model ${collection.relationData.model.name} - no valid values found`,
          );
          return;
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
        // Remove from the FileEntry table
        await FileEntry.query().delete().whereIn("id", toNull).exec();
        this.logger.info(
          `Set ${toNull.length} references to null for ${collection.relationData.model.name}. Removed all from FileEntry table.`,
        );
      }),
    );
  }

  private async askForListing(values: string[] | Set<string>) {
    const response = await this.prompt.confirm("List values?", {
      default: false,
    });
    if (response) {
      values.forEach((value) => {
        this.logger.info(value);
      });
    }
  }

  private checkIfValidDir(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  //Filter out only files that have valid UUIDs as filenames
  private getValidFiles(dirPath: string): LocalFileEntry[] {
    const uuidRegex =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi; //borrowed from AdminJS implementation
    const filenames = fs.readdirSync(dirPath);
    return filenames
      .map((filename) => path.parse(filename))
      .filter((pathObj) => {
        return uuidRegex.test(pathObj.name);
      })
      .map((pathObj) => ({
        uuid: pathObj.name,
        ext: pathObj.ext,
      }));
  }
}
