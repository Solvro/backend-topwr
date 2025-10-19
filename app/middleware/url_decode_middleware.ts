import { HttpContext } from "@adonisjs/core/http";
import { NextFn } from "@adonisjs/core/types/http";

import { BadRequestException } from "#exceptions/http_exceptions";

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class UrlDecodeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // decode path params
    for (const [key, value] of Object.entries(ctx.params)) {
      if (typeof value === "string") {
        try {
          ctx.params[key] = decodeURIComponent(value);
        } catch (e) {
          throw new BadRequestException(`Malformed path parameter "${key}"`, {
            cause: e,
            code: "E_MALFORMED_URI",
          });
        }
      }
    }
    return next();
  }
}
