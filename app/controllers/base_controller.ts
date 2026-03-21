import { assertDefined } from "@solvro/utils/option";
import type { Dirent } from "node:fs";
import * as fs from "node:fs/promises";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import type { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { ForbiddenException } from "#app/exceptions/http_exceptions";

const LOADABLE_EXTENSIONS = [".js", ".ts"];

export default abstract class BaseController {
  /**
   * With the default implementation of `authenticate()`, if the user has any of the following roles, the permission checks are skipped.
   */
  protected superUserRoles: string[] = ["solvro_admin"];

  /**
   * Check whether the current user is a super user.
   *
   * Super user roles for a particular controller can be defined in its properties.
   * This method does not force authentication - unauthenticated users are not considered super users. (obviously lol)
   * Only one of the defined roles is requred for a user to be considered a super user.
   *
   * @param auth the authentication context
   * @returns true if the user is a super user
   */
  protected async isSuperUser(auth: HttpContext["auth"]): Promise<boolean> {
    // no roles defined - definitely not a superuser then
    if (this.superUserRoles.length === 0) {
      return false;
    }
    // not logged in - not a super user
    if (!(await auth.check())) {
      return false;
    }
    // it is known at this point that the user is authenticated
    assertDefined(auth.user);
    // check for superuser roles
    return await auth.user.hasAnyRole(...this.superUserRoles);
  }

  /**
   * Require that the currently logged in user is a super user
   *
   * Super user roles for a particular controller can be defined in its properties.
   * This method does force authentication and will throw a ForbiddenException if the current user is not a super user.
   * Only one of the defined roles is requred for a user to be considered a super user.
   *
   * @param auth the authentication context
   * @throws ForbiddenException if the current user is not a super user
   */
  protected async requireSuperUser(auth: HttpContext["auth"]): Promise<void> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    if (!(await this.isSuperUser(auth))) {
      throw new ForbiddenException();
    }
  }

  /**
   * Configure your routes here using standard adonis router functions.
   * You will automatically be scoped to your controller path.
   */
  abstract $configureRoutes(
    controller: LazyImport<Constructor<BaseController>>,
  ): void;

  /**
   * Generates a configuration callback for a controller using its lazy import
   */
  static async configureRoutes(
    controller: LazyImport<Constructor<unknown>>,
    debugName: string,
  ): Promise<() => void> {
    const imported = await controller();
    const ControllerCtor = imported.default as new (
      ...args: unknown[]
    ) => unknown;
    const instance: unknown = new ControllerCtor();
    if (!(instance instanceof BaseController)) {
      throw new Error(
        `Attempted to configure routes for a class that does not extend BaseController: ${debugName}`,
      );
    }
    return instance.$configureRoutes.bind(
      instance,
      controller as LazyImport<Constructor<BaseController>>,
    );
  }

  /**
   * Generates a configuration callback that configures each of the named controllers
   */
  static async configureByNames(paths: string[]): Promise<() => void> {
    const toConfigure: [string, () => void][] = await Promise.all(
      paths.map(async (path) => {
        const controller = (async () =>
          await import(`#controllers/${path}`)) as LazyImport<
          Constructor<unknown>
        >;
        return [path, await BaseController.configureRoutes(controller, path)];
      }),
    );
    return () => {
      for (const [path, config] of toConfigure) {
        const name = path.split("/").at(-1) ?? path;
        router.group(config).prefix(`/${name}`).as(name);
      }
    };
  }

  /**
   * Configures all controller routes automatically
   */
  static async configureAll(): Promise<void> {
    // find all version directories
    let version = 0;
    // map endpoint names to version directories
    // allows new API versions to inherit from earlier ones without symlinks or code duplication
    const currentEndpoints = new Map<string, number>();
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
          currentEndpoints.set(
            controllerFile.name.substring(
              0,
              controllerFile.name.length - ext.length,
            ),
            version,
          );
          break;
        }
      }
      await verDirReader.close();

      // configure
      const configureVersion = await BaseController.configureByNames(
        currentEndpoints
          .entries()
          .map(([name, ver]) => `v${ver}/${name}`)
          .toArray(),
      );
      router
        .group(configureVersion)
        .prefix(`/api/v${version}`)
        .as(`v${version}`);
    }
  }
}
