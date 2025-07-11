import { Logger } from "@poppinss/cliui";
import { TaskCallback } from "@poppinss/cliui/types";
import { Semaphore } from "@solvro/utils/semaphore";
import * as fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { BaseCommand, args, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { LucidModel } from "@adonisjs/lucid/types/model";

import { LinkType, detectLinkType } from "#enums/link_type";
import {
  analyzeErrorStack,
  prepareReportForLogging,
  toIBaseError,
} from "#exceptions/base_error";
import FilesService from "#services/files_service";
import { modelCount } from "#utils/db";

/*
 * The scraper framework
 *
 * How to run scrapers:
 * - run `node ace db:scrape`
 * - select modules to run (or pass in the --run-all/--all/-a flag to select all)
 * - done
 *
 * How to create scraper modules:
 * - create a new file in the /database/scrapers directory
 * - create a class that extends BaseScraperModule and set it as the default export
 * - define the short module `name`, longer `description` and optionally a `taskTitle` as static strings
 *   - `name` is shown in the module picker dialog. it must be unique.
 *   - `description` is shown in the module picker dialog
 *   - `taskTitle` is shown as the initial task title in the logs. if `taskTitle` is not defined, `description` is used instead
 * - define the async `run` method
 *   - the method may return a string, or return nothing. the return value is used as the final completion message. "Done" is used if nothing is returned
 *   - the method may take a `task` parameter which can be used to update the task status
 *   - thrown errors are caught, printed and interpreted as task failure
 *   - the method may use `this.logger` for logging
 *   - the method should use `this.semaphore` for limiting the amount of parallel requests (if such are made)
 *   - the method may use utility methods inherited from the BaseScraperModule class
 * - if your scraper script is expected to only run once, override the `shouldRun` method
 *   - for example check whether entries already exist in the database
 */

const LOADABLE_EXTENSIONS = [".js", ".cjs", ".mjs", ".ts"];

export type TaskHandle = Parameters<TaskCallback>[0];

export interface SourceResponse<T> {
  data: T[];
}

export function assertResponseStructure(
  response: unknown,
  name: string,
): SourceResponse<unknown> {
  if (
    !(
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      Array.isArray(response.data)
    )
  ) {
    throw new Error(`Invalid response structure for ${name}`);
  }
  return response as SourceResponse<unknown>;
}

export abstract class BaseScraperModule {
  static name: string;
  static description: string;
  static taskTitle?: string;
  logger: Logger;
  semaphore: Semaphore;

  constructor(logger: Logger, semaphore: Semaphore) {
    this.logger = logger;
    this.semaphore = semaphore;
  }

  /**
   * Checks whether the scraper module should be run.
   *
   * This function should not modify the database or filesystem!
   * Default implementation always returns true.
   * @param _task the task handle, should you want to do status updates here
   * @returns true if the run() method should be called
   */
  async shouldRun(_task: TaskHandle): Promise<boolean> {
    return true;
  }

  /**
   * The main function of a scraper module
   *
   * Fetch external data and modify the database entries here.
   * @param task the task handle, for updating the task status
   */
  abstract run(task: TaskHandle): Promise<string> | Promise<void>;

  /**
   * Fetch the provided URL and throw an error if the status code is not in the 2xx range.
   *
   * @param url - URL to fetch
   * @param item - type of data being fetched - this is used to generate accurate error context messages
   * @throws when the response status code is outside of the 2xx range
   * @returns the HTTP response object
   */
  protected async fetchAndCheckStatus(
    url: string,
    item: string,
  ): Promise<Response> {
    let response;
    try {
      response = await fetch(url);
    } catch (e) {
      throw new Error(`Failed to fetch ${item}`, { cause: e });
    }
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${item} - got response status code ${response.status} ${response.statusText}`,
      );
    }
    return response;
  }

  /**
   * Fetch the provided URL and deserialize the response as JSON.
   *
   * @param url - URL to fetch
   * @param item - type of data being fetched - this is used to generate accurate error context messages
   * @throws when the response status code is outside of the 2xx range, or if the response deserializes to something other than an object
   * @returns the desialized JSON response
   */
  protected async fetchJSON(url: string, item: string): Promise<object> {
    const response = await this.fetchAndCheckStatus(url, item);
    let result;
    try {
      result = await response.json();
    } catch (e) {
      throw new Error(`Failed to deserialize ${item}`, { cause: e });
    }
    if (typeof result !== "object" || result === null) {
      throw new Error(
        `Expected the type of deserialized fetch response for ${item} to be an object, but got ${result === null ? "null" : typeof result} instead`,
      );
    }
    return result;
  }

  protected async fetchDirectusJSON(
    url: string,
    item: string,
  ): Promise<SourceResponse<unknown>> {
    const response = await this.fetchJSON(url, item);
    return assertResponseStructure(response, item);
  }

  /**
   * Detect the link type of the given URL.
   *
   * This is a wrapper around the `detectLinkType` function in `#enums/link_type` that automatically logs any returned warnings
   * @param link - URL to examine
   * @returns the detected LinkType
   */
  protected detectLinkType(link: string): LinkType {
    const { type, warning } = detectLinkType(link);
    if (warning !== undefined) {
      this.logger.warning(warning);
    }
    return type;
  }

  /**
   * Convienience method for checking whether tables for models are empty
   *
   * Probably useful for implementing shouldRun()
   * @param models the lucidjs models to check
   * @returns true if all tables for all the given models are empty
   */
  protected async modelHasNoRows(...models: LucidModel[]): Promise<boolean> {
    return Promise.all(
      models.map(async (m) => (await modelCount(m)) === 0),
      // "then get the list, and ensure that every boolean value is true"
    ).then((l) => l.every((b) => b));
  }

  /**
   * Download a file from Directus and save it using our FileService.
   *
   * The file extension will default to 'bin' if none found - will log if it happens.
   * @param fileId Id under which the file is supposed to be on `https://admin.topwr.solvro.pl/assets/${fileId}`
   * @returns fileId if uploading was successful, null otherwise.
   */
  protected async directusUploadFieldAndGetKey(
    fileId: string,
  ): Promise<string> {
    const extension = await this.findFileExtension(fileId);
    const imageStream = await this.fetchAndCheckStatus(
      `https://admin.topwr.solvro.pl/assets/${fileId}`,
      `Directus image file ${fileId}`,
    ).then((response) => response.body);
    if (imageStream === null) {
      throw new Error(
        `Failed to fetch image file ${fileId} - empty response from Directus`,
      );
    }
    const file = await FilesService.uploadStream(
      Readable.fromWeb(imageStream),
      extension,
    ).addErrorContext(() => `Failed to upload file with key '${fileId}'`);
    return file.id;
  }

  private async findFileExtension(fileId: string): Promise<string> {
    const extension = (await this.fetchJSON(
      `https://admin.topwr.solvro.pl/files/${fileId}?fields=filename_disk`,
      `File metadata of ${fileId}`,
    )) as { data: { filename_disk: string } };
    const ext = extension.data.filename_disk.split(".").pop();
    if (ext === undefined || ext === "") {
      this.logger.warning(
        `Failed to obtain file extension for ${fileId}. Fall back to the default "bin" extension. Cause: no extension present in the filename`,
      );
      return "bin";
    }
    return ext.toLowerCase();
  }
}

type ScraperModuleClass = (new (
  logger: Logger,
  semaphore: Semaphore,
) => BaseScraperModule) &
  typeof BaseScraperModule;

interface ScraperModuleEntry {
  Module: ScraperModuleClass;
  instance: BaseScraperModule;
  file: string;
}

function isScraperModule(module: unknown): module is ScraperModuleClass {
  return (
    module !== null &&
    module !== undefined &&
    typeof module === "function" &&
    "prototype" in module &&
    typeof module.prototype === "object" &&
    module.prototype instanceof BaseScraperModule
  );
}

function trimModuleExtension(filename: string): string {
  for (const ext of LOADABLE_EXTENSIONS) {
    if (!filename.endsWith(ext)) {
      continue;
    }
    filename = filename.substring(0, filename.length - ext.length);
    break;
  }
  return filename;
}

export default class DbScrape extends BaseCommand {
  static commandName = "db:scrape";
  static description =
    "Runs scraper modules to populate the DB with external data";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    alias: ["all", "a"],
    description: "Select all available modules without asking",
  })
  declare runAll: boolean;

  @flags.number({
    alias: ["j"],
    description:
      "Max number of parallel jobs/fetches/etc. (default semaphore capacity, usage is implementation-dependant)",
    default: 16,
  })
  declare maxJobs: number;

  @flags.boolean({
    description: "Skip shouldRun() checks on modules and run them anyway",
  })
  declare force: boolean;

  @args.spread({
    required: false,
    description: "Names or filenames of modules to run",
  })
  declare modules: string[] | undefined;

  async run() {
    // just exit with error by default
    this.exitCode = 1;

    this.logger.info("Loading modules...");
    const modules = await this.loadModules();

    if (Object.keys(modules).length === 0) {
      this.logger.warning("No modules found");
      return;
    }

    if (this.modules !== undefined && this.runAll) {
      this.logger.error(
        "Conflicting command arguments: --run-all cannot be used with module names!",
      );
      return;
    }

    if (this.force) {
      this.logger.warning(
        "Force flag passed - modules will be run even if shouldRun() would return false!",
      );
    }

    let selectedModules: ScraperModuleEntry[];
    if (this.runAll) {
      selectedModules = Object.values(modules);
      this.logger.info(
        `runAll flag is set - running all ${selectedModules.length} modules.`,
      );
    } else if (this.modules !== undefined) {
      selectedModules = [];
      for (const name of this.modules) {
        const trimmedName = trimModuleExtension(name);
        let module = modules[name] as ScraperModuleEntry | undefined;
        module ??= Object.entries(modules).find(
          ([_, entry]) =>
            // basically: compare unmodified name if provided name had no valid extension, otherwise trim the ext before comparing
            trimmedName ===
            (name === trimmedName
              ? entry.file
              : trimModuleExtension(entry.file)),
        )?.[1];

        if (module === undefined) {
          this.logger.error(`Could not find the "${name}" module`);
          return;
        }
        if (selectedModules.includes(module)) {
          this.logger.error(`Module "${module.file}" was specified twice!`);
          return;
        }
        selectedModules.push(module);
      }
    } else {
      const selected = await this.prompt.multiple(
        "Select scraper modules to run",
        Object.entries(modules).map(([name, entry]) => {
          return {
            name,
            message: `${name} (${entry.Module.description}: ${entry.file})`,
          };
        }),
      );
      selectedModules = selected.map((name) => modules[name]);
      this.logger.info(`Running ${selectedModules.length} selected modules.`);
    }

    const tasks = this.ui.tasks({ verbose: true });

    for (const { Module, instance } of selectedModules) {
      tasks.add(Module.taskTitle ?? Module.description, async (task) => {
        try {
          if (!this.force && !(await instance.shouldRun(task))) {
            return "Skipped";
          }
        } catch (e) {
          const report = analyzeErrorStack(toIBaseError(e));
          const errorString = prepareReportForLogging(report, {
            includeCodeAndStatus: false,
          }).replaceAll("\n", "\n│ "); // a lil bit of formatting
          return task.error(
            `Module's shouldRun() method threw an error: ${errorString}`,
          );
        }
        try {
          return ((await instance.run(task)) as string | undefined) ?? "Done";
        } catch (e) {
          const report = analyzeErrorStack(toIBaseError(e));
          const errorString = prepareReportForLogging(report, {
            includeCodeAndStatus: false,
          }).replaceAll("\n", "\n│ "); // a lil bit of formatting
          return task.error(
            `Module's run() method threw an error: ${errorString}`,
          );
        }
      });
    }

    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }

  async loadModules(): Promise<Record<string, ScraperModuleEntry>> {
    const dir = path.resolve("./database/scrapers");
    const files = await fs.readdir("./database/scrapers");
    const semaphore = new Semaphore(this.maxJobs);

    const imports = await Promise.all(
      files
        .filter((file) => {
          // filter out files that can't be loaded
          if (
            file.endsWith(".d.ts") ||
            file.endsWith(".js.map") ||
            file === ".gitkeep"
          ) {
            return false; // doesn't need a warning
          }
          const canLoad = LOADABLE_EXTENSIONS.some((ext) => file.endsWith(ext));
          if (!canLoad) {
            this.logger.warning(
              `Non-JS file was found in the database/scrapers/ directory: ${file}`,
            );
          }
          return canLoad;
        })
        .map(async (file) => {
          // import each file
          try {
            return {
              imported: (await import(
                `file://${path.resolve(dir, file)}`
              )) as object,
              file,
            };
          } catch (error) {
            throw Error(`Failed to import file ${file}`, { cause: error });
          }
        })
        .map((p) =>
          p.then(async (module) => {
            if (
              !(
                "default" in module.imported &&
                isScraperModule(module.imported.default)
              )
            ) {
              throw Error(
                `File ${module.file} does not contain a BaseScraperModule as its default export!`,
              );
            }
            return { Module: module.imported.default, file: module.file };
          }),
        ),
    );

    const result: Partial<Record<string, ScraperModuleEntry>> = {};
    for (const { Module, file } of imports) {
      const existingModule = result[Module.name];
      if (existingModule !== undefined) {
        throw new Error(
          `Detected duplicate scraper module named '${Module.name}': '${existingModule.file}' and '${file}'!`,
        );
      }
      let instance: BaseScraperModule;
      try {
        instance = new Module(this.logger, semaphore);
      } catch (e) {
        throw new Error(
          `Failed to instantiate the '${Module.name}' scraper module`,
          { cause: e },
        );
      }
      result[Module.name] = { Module, instance, file };
    }

    return result as Record<string, ScraperModuleEntry>;
  }
}
