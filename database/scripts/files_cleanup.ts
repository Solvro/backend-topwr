import assert from "node:assert";
import * as fs from "node:fs";
import path from "node:path";

import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { LucidModel, LucidRow } from "@adonisjs/lucid/types/model";

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

export default class CleanupFiles extends BaseCommand {
  static commandName = "db:file_clean";
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
    const dbFileEntry = await FileEntry.query();
    task.update(`Found ${dbFileEntry.length} files in the FileEntry table`);
    // ----
    task.update("Stage 3 - Looking for models with relations to FileEntry");
    const relations: DBRelation[] = [];
    FileEntry.$relationsDefinitions.forEach((relation) => {
      if (!relation.booted) {
        relation.boot();
      }
      const relationName = relation.relationName;
      const thatModel = relation.relatedModel();
      assert(
        relation.type === "hasMany",
        `Invalid relation definition for ${thatModel.name} at ${relationName}}`,
      );
      const foreignKey = relation.foreignKeyColumnName;
      const column = thatModel.$getColumn(foreignKey);
      assert(column !== undefined);
      const castColumn = column as ValidatedColumnDef;
      relations.push({
        model: thatModel,
        column: foreignKey,
        isNullable: castColumn.meta.typing.optional,
      });
    });
    task.update(`Found ${relations.length} related models`);
    // ----
    task.update("Stage 4 - indexing files used by the related models");
    const usedFiles: DBUsedFiles[] = await Promise.all(
      relations.map(async (value) => {
        const result = await value.model.query().select(value.column).exec();
        const key = value.column as keyof LucidRow;
        const uuids = result.map((row) => row[key]);
        return {
          relationData: value,
          uuids,
        } as DBUsedFiles;
      }),
    );
    // ----
    task.update("Stage 5 - comparison preparations");
    const localSet: Set<string> = new Set<string>(
      localFiles.map((file) => file.uuid),
    );
    const fileEntrySet: Set<string> = new Set<string>(
      dbFileEntry.map((entry) => entry.id),
    );
    const modelSet: Set<string> = new Set<string>(
      usedFiles.flatMap((file) => file.uuids.filter((uuid) => uuid !== null)),
    );
    // ----
    task.update("Stage 6 - orphaned files");
    const orphanedFiles = localSet.difference(fileEntrySet);
    task.update(`Found ${orphanedFiles.size} orphaned files`);
    const orphanedConfirmation = await this.prompt.confirm(
      "Delete all orphaned files from the file system?",
      { default: false },
    );
    if (orphanedConfirmation) {
      task.update(
        `Attempting to delete ${orphanedFiles.size} orphaned files...`,
      );
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
      task.update(`Deleted ${orphanedFiles.size} orphaned files`);
    } else {
      task.update(`Skipping deletion of orphaned files`);
    }
    // ----
    task.update("Stage 7 - unused files");
    const unusedFiles = fileEntrySet.difference(modelSet);
    task.update(`Found ${unusedFiles.size} unused files`);
    const unusedConfirmation = await this.prompt.confirm(
      "Delete all unused files from the file system and the database?",
      { default: false },
    );
    if (unusedConfirmation) {
      task.update(`Attempting to delete ${unusedFiles.size} unused files...`);
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
      task.update(`Deleted ${unusedFiles.size} unused files`);
    } else {
      task.update(`Skipping deletion of unused files`);
    }
    // ----
    task.update("Stage 8 - ghost files");
    const ghostFiles = fileEntrySet.difference(localSet);
    task.update(`Found ${ghostFiles.size} ghost files`);
    const ghostConfirmation = await this.prompt.confirm(
      "For all nullable references: Replace all ghost files references with null and delete them from FileEntry table?",
      { default: false },
    );
    if (ghostConfirmation) {
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
          const column = collection.relationData.column;
          // Remove from the model table
          await collection.relationData.model
            .query()
            .whereIn(column, toNull)
            .update({ column: null })
            .exec();
          // Remove from the FileEntry table
          await FileEntry.query().delete().whereIn("id", toNull).exec();
          task.update(
            `Set ${toNull.length} references to null for ${collection.relationData.model.name}. Removed all from FileEntry table.`,
          );
        }),
      );
    } else {
      task.update(`Skipping ghost file cleanup`);
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
