import { AclManager } from "@holoyan/adonisjs-permissions";

import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

declare module "@adonisjs/core/http" {
  export interface HttpContext {
    acl: AclManager;
  }
}

export default class UserScopeMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { permission: string },
  ) {
    const hasPermission = await ctx.auth.user?.hasPermission(
      options.permission,
    );

    if (!hasPermission) {
      ctx.response.abort(
        { message: "User does not have the required permission" },
        403,
      );
    }

    const output = await next();
    return output;
  }
}
