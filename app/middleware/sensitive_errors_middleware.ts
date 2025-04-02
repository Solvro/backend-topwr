import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

import { ExceptionHandlerContextExtras } from "#exceptions/handler";

/**
 * Marks all exceptions as sensitive, preventing the full cause stack from being sent to the user
 */
export default class SensitiveErrorsMiddleware {
  async handle(ctx: HttpContext & ExceptionHandlerContextExtras, next: NextFn) {
    ctx.extras ??= {};
    ctx.extras.sensitive = true;
    return next();
  }
}
