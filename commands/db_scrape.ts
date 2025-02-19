import { Logger } from "@poppinss/cliui";
import { TaskCallback } from "@poppinss/cliui/types";
import * as fs from "node:fs/promises";
import path from "node:path";

import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

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
 */

const LOADABLE_EXTENSIONS = [".js", ".cjs", ".mjs", ".ts"];

export type TaskHandle = Parameters<TaskCallback>[0];

export abstract class BaseScraperModule {
  static name: string;
  static description: string;
  static taskTitle?: string;
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  abstract run(task: TaskHandle): Promise<string> | Promise<void>;
}

type ScraperModuleClass = (new (logger: Logger) => BaseScraperModule) &
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

export default class DbScrape extends BaseCommand {
  static commandName = "db:scrape";
  static description =
    "Runs scraper modules to populate the DB with external data";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    alias: ["all", "a"],
  })
  declare runAll: boolean;

  async run() {
    this.logger.info("Loading modules...");
    const modules = await this.loadModules();

    if (Object.keys(modules).length === 0) {
      this.logger.warning("No modules found");
      return;
    }

    let selectedModules: ScraperModuleEntry[];
    if (this.runAll) {
      selectedModules = Object.values(modules);
      this.logger.info(
        `runAll flag is set - running all ${selectedModules.length} modules.`,
      );
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
      // @ts-expect-error https://github.com/poppinss/cliui/issues/22
      tasks.add(Module.taskTitle ?? Module.description, async (task) => {
        try {
          return ((await instance.run(task)) as string | undefined) ?? "Done";
        } catch (e) {
          console.error(e);
          return task.error("Module threw an error");
        }
      });
    }

    await tasks.run();
    this.exitCode = tasks.getState() === "succeeded" ? 0 : 1;
  }

  async loadModules(): Promise<Record<string, ScraperModuleEntry>> {
    const dir = path.resolve("./database/scrapers");
    const files = await fs.readdir("./database/scrapers");

    const imports = await Promise.all(
      files
        .filter((file) => {
          // filter out files that can't be loaded
          if (file.endsWith(".d.ts") || file === ".gitkeep") {
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
        .map(
          (file) =>
            file.endsWith(".ts") ? file.replace(/\.ts$/, ".js") : file, // replace .ts with .js
        )
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
        instance = new Module(this.logger);
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
