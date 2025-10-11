import { BaseError, BaseErrorOptions } from "@solvro/error-handling/base";

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

export class TooManyRequestsException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Too many requests", {
      code: "E_TOO_MANY_REQUESTS",
      ...options,
      status: 429,
    });
  }
}

export class UnauthorizedException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Unathorized access", {
      code: "E_UNAUTHORIZED",
      ...options,
      status: 401,
    });
  }
}

export class InternalServerException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Internal server error", {
      code: "E_INTERNAL_SERVER_ERROR",
      ...options,
      status: 500,
    });
  }
}

export class ServiceUnavailableException extends BaseError {
  constructor(message?: string, options?: BaseErrorOptions) {
    super(message ?? "Service unavailable", {
      code: "E_SERVICE_UNAVAILABLE",
      ...options,
      status: 503,
    });
  }
}
