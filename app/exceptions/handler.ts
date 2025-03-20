import { ExceptionHandler, HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import logger from "@adonisjs/core/services/logger";

import {
  ErrorResponse,
  analyzeErrorStack,
  toIBaseError,
} from "./base_error.js";

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction;

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const report = analyzeErrorStack(toIBaseError(error));
    if (!report.code.startsWith("E_")) {
      logger.warn(
        `Found error stack with a code that does not start with 'E_' ('${report.code}'). Replacing with 'E_UNEXPECTED_ERROR' in the response!`,
      );
      report.code = "E_UNEXPECTED_ERROR";
    }
    const response: ErrorResponse = {
      error: {
        message: report.message,
        code: report.code,
        validationIssues:
          report.code === "E_VALIDATION_ERROR"
            ? (report.validationIssues ?? [])
            : undefined,
        causeStack: report.sensitive ? undefined : report.causeStack,
        rootStackTrace: this.debug ? report.rootStackTrace : undefined,
      },
    };
    ctx.response.status(report.status).send(response);
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    const report = analyzeErrorStack(toIBaseError(error));
    if (report.silent) {
      return;
    }
    logger.error(
      [
        `Error thrown while handling route ${ctx.route?.name ?? ctx.route?.pattern ?? "<unknown>"}: ${report.message}`,
        `Error code: ${report.code}, status: ${report.status}`,
        `Cause stack:\n${report.causeStack.map((c) => `    ${c}`).join("\n")}`,
        `Root stack trace:\n${report.rootStackTrace.map((f) => `    ${f}`).join("\n")}`,
      ].join("\n"),
    );
  }
}
