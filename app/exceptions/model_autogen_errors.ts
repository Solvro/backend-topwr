import { BaseErrorOptions } from "./base_error.js";
import { InternalServerException } from "./http_exceptions.js";

export class InvalidModelDefinition extends InternalServerException {
  constructor(message: string, options?: BaseErrorOptions) {
    super(message, {
      code: "E_INVALID_MODEL_DEFINITION",
      ...options,
    });
  }
}
