import { BaseErrorOptions } from "@solvro/error-handling/base";

import { InternalServerException } from "./http_exceptions.js";

export class InvalidModelDefinition extends InternalServerException {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, {
      code: "E_INVALID_MODEL_DEFINITION",
      ...options,
    });
  }
}
