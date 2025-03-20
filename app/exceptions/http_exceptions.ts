import { BaseError, BaseErrorOptions } from "./base_error.js";

export class BadRequestException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Bad request", {
      code: "E_BAD_REQUEST",
      ...options,
      status: 400,
    });
  }
}

export class ForbiddenException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Forbidden", {
      code: "E_FORBIDDEN",
      ...options,
      status: 403,
    });
  }
}

export class NotFoundException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Not found", {
      code: "E_NOT_FOUND",
      ...options,
      status: 404,
    });
  }
}

export class NotImplementedException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Not implemented", {
      code: "E_NOT_IMPLEMENTED",
      ...options,
      status: 501,
    });
  }
}
