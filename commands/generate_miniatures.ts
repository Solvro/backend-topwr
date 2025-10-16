import { toIBaseError } from "@solvro/error-handling/base";
import {
  analyzeErrorStack,
  prepareReportForLogging,
} from "@solvro/error-handling/reporting";
import * as fs from "node:fs";
import path from "node:path";

import { flags } from "@adonisjs/core/ace";
import router from "@adonisjs/core/services/router";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import drive from "@adonisjs/drive/services/main";

import BaseCommandExtended, {
  SupportsListing,
} from "#commands/base_command_extended";
import { TaskHandle } from "#commands/db_scrape";
import {
  MINIATURES_DRIVE,
  MINIATURES_STORAGE_PATH,
  STORAGE_PATH,
  ensureStorageDirsExist,
} from "#config/drive";
import FileEntry, { PHOTO_LIKE_EXT } from "#models/file_entry";
import { resizeFromPathOrBytes } from "#utils/images";

class LocalFileEntry implements SupportsListing {
  key: string;
  hasMiniature: boolean;

  constructor(key: string, hasMiniature: boolean) {
    this.key = key;
    this.hasMiniature = hasMiniature;
  }

  list(): string {
    return this.key;
  }
}

export default class GenerateMiniatures extends BaseCommandExtended {
  static commandName = "generate_miniatures";
  static description =
    "Runs a script that attempts to generate missing miniatures for all photo-like files that are indexed in the database." +
    " If used with --all flag, it will regenerate all miniatures, not only the missing ones.";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    description:
      "Recompute all miniatures, not only the missing ones. Will replace any exising ones.",
  })
  declare all: boolean;

  @flags.boolean({
    description: "Use default values for all prompts - skip listing any values",
  })
  declare force: boolean;

  async run() {
    if (!router.commited) {
      router.commit();
    }
    if (this.all) {
      this.logger.warning(
        "Will generating or regenerate all miniatures, not only the missing ones. Will replace any exising ones.",
      );
    }
    if (this.force) {
      this.autoUseDefaultPromptValues();
    }
    const tasks = this.ui.tasks({ verbose: true });
    tasks.add("GenerateMiniatures", async (task) => {
      try {
        return ((await this.runInternal(task)) as string | undefined) ?? "Done";
      } catch (e) {
        const report = analyzeErrorStack(toIBaseError(e));
        const errorString = prepareReportForLogging(report, {
          includeCodeAndStatus: false,
        }).replaceAll("\n", "\n│ ");
        return task.error(
          `GenerateMiniatures run() method threw an error: ${errorString}`,
        );
      }
    });
    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }

  private async runInternal(task: TaskHandle) {
    // Ensure the miniatures and storage directories exist
    ensureStorageDirsExist();
    // Stage 1 - Fetch applicable file metadata from the database to avoid computing for orphaned files
    task.update("Stage 1 - Fetching photo-like file entries from the database");
    if (!FileEntry.booted) {
      FileEntry.boot();
    }
    const photoLike = await FileEntry.query().whereIn(
      "fileExtension",
      PHOTO_LIKE_EXT,
    );
    const entryFullNames = new Set<string>(
      photoLike.map((entry) => entry.keyWithExtension),
    );
    task.update(`Found ${entryFullNames.size} photo-like file entries`);
    if (entryFullNames.size === 0) {
      task.update("No photo-like file entries found. Exiting early");
      return;
    }
    await this.askForListing(
      "List all photo-like file entries?",
      entryFullNames,
    );
    // Stage 2 - Get all matching files from the disk with information about their miniature existence
    task.update("Stage 2 - Fetching matching original files from the disk");
    const matchingFiles = this.getValidFiles(
      STORAGE_PATH,
      MINIATURES_STORAGE_PATH,
      entryFullNames,
    );
    task.update(`Found ${matchingFiles.length} matching files on disk`);
    const withoutMiniatures = matchingFiles.filter(
      (file) => !file.hasMiniature,
    );
    task.update(
      `${matchingFiles.length - withoutMiniatures.length} of them already have miniatures`,
    );
    // Choose files to generate miniatures for
    let toGenerate: LocalFileEntry[];
    if (this.all) {
      task.update(
        `Will compute miniatures for all ${matchingFiles.length} files`,
      );
      toGenerate = matchingFiles;
    } else {
      task.update(
        `Will compute miniatures for ${withoutMiniatures.length} files`,
      );
      toGenerate = withoutMiniatures;
    }
    if (toGenerate.length === 0) {
      task.update("No files to compute miniatures for. Exiting early");
      return;
    }
    await this.askForListing(
      "List all files to compute miniatures for?",
      toGenerate,
    );
    // Stage 3 - Generate miniatures
    task.update("Stage 3 - Generating miniatures");
    const miniaturesDrive = drive.use(MINIATURES_DRIVE);
    let failureCount = 0;
    for (let i = 0; i < toGenerate.length; i++) {
      const current = toGenerate[i];
      const filepath = path.join(STORAGE_PATH, current.key);
      let miniature;
      // Try to generate miniature
      try {
        miniature = await resizeFromPathOrBytes(filepath);
      } catch (error) {
        failureCount += 1;
        this.logger.warning(
          `Failed to generate miniature for ${current.key}. Cause: ${(error as Error).message}`,
        );
        continue;
      }
      // Save the miniature
      try {
        miniature = await miniaturesDrive.put(current.key, miniature);
      } catch (error) {
        failureCount += 1;
        this.logger.warning(
          `Failed to upload miniature for ${current.key}. Cause: ${(error as Error).message}`,
        );
      }
      task.update(`${i + 1}/${toGenerate.length} done`);
    }
    task.update(
      `Generated ${toGenerate.length - failureCount} miniatures, ${failureCount} failed`,
    );
  }

  private getValidFiles(
    dirPath: string,
    miniaturesDirPath: string,
    entryFullNames: Set<string>,
  ): LocalFileEntry[] {
    const miniaturesFiles = new Set<string>(fs.readdirSync(miniaturesDirPath));
    return fs
      .readdirSync(dirPath)
      .filter((name) => entryFullNames.has(name))
      .map((name) => {
        // Check if miniature exists
        return new LocalFileEntry(name, miniaturesFiles.has(name));
      });
  }
}
