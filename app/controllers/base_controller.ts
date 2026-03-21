import { assertDefined } from "@solvro/utils/option";

import type { HttpContext } from "@adonisjs/core/http";
import type { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { ForbiddenException } from "#app/exceptions/http_exceptions";

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
}
