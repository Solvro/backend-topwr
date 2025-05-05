import { BaseError } from "./base_error.js";

export class InternalControllerValidationError extends BaseError {
  constructor(validationIssues: string[]) {
    super("Internal controller implementation validation failed", {
      messages: validationIssues,
      code: "E_INTERNAL_CONTROLLER_VALIDATION_ERROR",
      status: 500,
    });
  }
}

export class InternalControllerError extends BaseError {
  constructor(message: string) {
    super(message, {
      code: "E_INTERNAL_CONTROLLER_ERROR",
      status: 500,
    });
  }
}
