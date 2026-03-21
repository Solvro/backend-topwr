import type { Dirent } from "node:fs";
import * as fs from "node:fs/promises";

import router from "@adonisjs/core/services/router";
import type { Constructor, LazyImport } from "@adonisjs/core/types/http";

import BaseController from "#controllers/base_controller";

export interface ControllerListing {
  apiVersion: number;
  controllers: Set<string>;
}

export interface ImportedController {
  name: string;
  apiVersion: number;
  lazyImport: LazyImport<Constructor<BaseController>>;
  constructor: Constructor<BaseController>;
  instance: BaseController;
  configureRoutes: () => void;
}

export interface ImportedApiVersion {
  apiVersion: number;
  // name to imported
  controllers: Map<string, ImportedController>;
}

const LOADABLE_EXTENSIONS = [".js", ".ts"];

/**
 * Returns a lazy import from the controller directory
 *
 * @param apiVersion version of the controller to import (need exact)
 * @param controllerName name of the controller to import
 */
export function lazyImportController(
  apiVersion: number,
  controllerName: string,
): LazyImport<Constructor<unknown>> {
  return (async () =>
    import(`#controllers/v${apiVersion}/${controllerName}`)) as LazyImport<
    Constructor<unknown>
  >;
}

/**
 * Finds all controllers across all versions
 * Does not do inheritance of controllers between versions
 */
export async function listAllControllers(): Promise<ControllerListing[]> {
  // find all version directories
  let version = 0;
  const result: ControllerListing[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    // iterate while directories for each version exist
    const dir = `./app/controllers/v${++version}`;
    try {
      const statResult = await fs.stat(dir);
      if (!statResult.isDirectory()) {
        break;
      }
    } catch {
      break;
    }

    const controllers = new Set<string>();

    // list directory files for the version
    const verDirReader = await fs.opendir(dir);
    let controllerFile: Dirent | null = null;
    while ((controllerFile = await verDirReader.read()) !== null) {
      // skip non-files
      if (!controllerFile.isFile()) {
        continue;
      }
      for (const ext of LOADABLE_EXTENSIONS) {
        // find the correct extension for the file
        if (!controllerFile.name.endsWith(ext)) {
          continue;
        }
        // add to list
        controllers.add(
          controllerFile.name.substring(
            0,
            controllerFile.name.length - ext.length,
          ),
        );
        break;
      }
    }
    await verDirReader.close();

    result.push({
      apiVersion: version,
      controllers,
    });
  }

  return result;
}

/**
 * Imports all controllers across all versions
 * Does not do inheritance of controllers between versions
 */
export async function importAllControllers(): Promise<ImportedApiVersion[]> {
  const listing = await listAllControllers();
  const result: ImportedApiVersion[] = [];

  for (const version of listing) {
    const controllers = new Map<string, ImportedController>();

    for (const controller of version.controllers) {
      const lazyImport = lazyImportController(version.apiVersion, controller);
      const imported = await lazyImport();
      const constructor = imported.default;
      const instance = new constructor();
      if (!(instance instanceof BaseController)) {
        throw new Error(
          `File app/controllers/v${version.apiVersion}/${controller}.ts doesn't default export a BaseController!`,
        );
      }

      controllers.set(controller, {
        apiVersion: version.apiVersion,
        name: controller,
        lazyImport: lazyImport as LazyImport<Constructor<BaseController>>,
        constructor: constructor as Constructor<BaseController>,
        instance,
        configureRoutes: instance.$configureRoutes.bind(
          instance,
          lazyImport as LazyImport<Constructor<BaseController>>,
        ),
      });
    }

    result.push({
      apiVersion: version.apiVersion,
      controllers,
    });
  }

  return result;
}

/**
 * Applies inheritance to a listing of imported api versions, modifying the list in place
 */
export function applyInheritance(listing: ImportedApiVersion[]) {
  // sort the versions ascending
  listing.sort((a, b) => a.apiVersion - b.apiVersion);
  let previousVersion = listing[0];

  // iterate over the listing
  for (const version of listing) {
    // iterate over previous versions' controllers
    for (const [name, controller] of previousVersion.controllers.entries()) {
      // if missing in new version, add
      if (!version.controllers.has(name)) {
        version.controllers.set(name, controller);
      }
    }
    previousVersion = version;
  }
}

/**
 * Configures all controller routes automatically
 */
export async function configureAllRoutes(): Promise<void> {
  const importedListing = await importAllControllers();
  applyInheritance(importedListing);

  for (const version of importedListing) {
    router
      .group(() => {
        for (const controller of version.controllers.values()) {
          router
            .group(controller.configureRoutes)
            .prefix(`/${controller.name}`)
            .as(controller.name);
        }
      })
      .prefix(`/api/v${version.apiVersion}`)
      .as(`v${version.apiVersion}`);
  }
}
