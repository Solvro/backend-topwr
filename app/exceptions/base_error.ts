interface JsonObject {
  [k: string]: JsonEncodable;
}

type JsonEncodable =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonEncodable[];

type ExtraResponseFields = Record<Exclude<string, "error">, JsonEncodable>;

/**
 * The expected structure for thrown errors
 */
export interface IBaseError {
  /**
   * Error message
   */
  message: string;
  /**
   * Error code, usually following the format of 'E_SOME_ERROR_CODE'
   *
   * Codes must start with `E_`.
   */
  code?: string;
  /**
   * Suggested HTTP response code to use when handling this error
   *
   * Codes below 500 imply silent=true, unless overriden.
   */
  status?: number;
  /**
   * List of validation issues
   */
  messages?: ValidationIssue[];
  /**
   * Error stack trace
   */
  stack?: string;
  /**
   * The error that caused this error
   */
  cause?: IBaseError;
  /**
   * Should this error stack be treated as sensitive?
   *
   * Sensitive errors only include the topmost error message in the error responses and don't include the contextStack property.
   * Error stacks start as non-sensitive, each layer may overwrite the setting by defining this prop.
   * If one layer marks the stack as sensitive and later one resets it to non-sensitive, the whole error stack is revealed.
   *
   * The final value for this property for the whole error stack is derived by traversing the entire error cause chain,
   * stopping when the first error with `sensitive` defined is found.
   */
  sensitive?: boolean;
  /**
   * Should this error stack be omitted from logs?
   *
   * This is intended to be used for regular expected errors. (such as errors caused by the client's bad request)
   * If an error has the `status` property defined, this property is treated as implicitly defined based on the `status` value:
   * - status values below 500 imply silent=true
   * - status values equal or above 500 imply silent=false
   * Errors may define both `status` and `silent` to override the implied value.
   *
   * The final value for this property for the whole error stack is derived by traversing the entire error cause chain,
   * stopping when the first error with `silent` or `status` defined is found.
   */
  silent?: boolean;
  /**
   * Fields to be added to the response.
   *
   * The final extra response fields will be calculated by collecting the fields set by each error layer.
   * If two layers define the same field, the value set by the top-most error will be used.
   * Object and array values will not be merged.
   */
  extraResponseFields?: ExtraResponseFields;
}

export interface ValidationIssue {
  message: string;
}

export function shallowIsIBaseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    // code
    (!("code" in error) ||
      error.code === undefined ||
      typeof error.code === "string") &&
    // status
    (!("status" in error) ||
      error.status === undefined ||
      typeof error.status === "number") &&
    // messages
    (!("messages" in error) ||
      error.messages === undefined ||
      (Array.isArray(error) &&
        error.every((val) => typeof val === "string"))) &&
    // stack
    (!("stack" in error) ||
      error.stack === undefined ||
      typeof error.stack === "string") &&
    // sensitive
    (!("sensitive" in error) ||
      error.sensitive === undefined ||
      typeof error.sensitive === "boolean") &&
    // silent
    (!("silent" in error) ||
      error.silent === undefined ||
      typeof error.silent === "boolean") &&
    // extraResponseFields
    (!("extraResponseFields" in error) ||
      error.extraResponseFields === undefined ||
      (typeof error.extraResponseFields === "object" &&
        error.extraResponseFields !== null &&
        !("error" in error.extraResponseFields)))
  );
}

export function isIBaseError(error: unknown): error is IBaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    shallowIsIBaseError(error) &&
    (!("cause" in error) ||
      error.cause === undefined ||
      isIBaseError(error.cause))
  );
}

/**
 * Note: results of this function are NOT guaranteed to be an instance of Error or BaseError!
 */
export function toIBaseError(error: unknown): IBaseError {
  if (typeof error !== "object" || error === null) {
    return {
      message: String(error),
    };
  }
  if (!shallowIsIBaseError(error)) {
    // something's wrong on this level, attempt to reconstruct an object with valid parts
    const reconstructed: IBaseError = {
      message:
        "message" in error && typeof error.message === "string"
          ? error.message
          : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- oh typescript... you haven't seen anything yet
            (JSON.stringify(error) ??
            "<an error value so weird, that i've got zero idea how to handle it>"),
    };
    if ("code" in error && typeof error.code === "string") {
      reconstructed.code = error.code;
    }
    if ("status" in error && typeof error.status === "number") {
      reconstructed.status = error.status;
    }
    if ("messages" in error && Array.isArray(error.messages)) {
      reconstructed.messages = error.messages.map((message) => {
        if (typeof message === "string") {
          return { message };
        }
        if (typeof message === "object") {
          return message;
        }
        return {
          message:
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TS hasn't seen anything yet lol
            JSON.stringify(message) ??
            "<the original validation message was really weird and could not be serialized>",
        };
      });
    }
    if ("stack" in error && typeof error.stack === "string") {
      reconstructed.stack = error.stack;
    }
    if ("sensitive" in error && typeof error.sensitive === "boolean") {
      reconstructed.sensitive = error.sensitive;
    }
    if ("silent" in error && typeof error.silent === "boolean") {
      reconstructed.silent = error.silent;
    }
    if ("cause" in error && error.cause !== undefined && error.cause !== null) {
      reconstructed.cause = toIBaseError(error.cause);
    }
    if (
      "extraResponseFields" in error &&
      error.extraResponseFields !== undefined &&
      error.extraResponseFields !== null &&
      typeof error.extraResponseFields === "object"
    ) {
      reconstructed.extraResponseFields = error.extraResponseFields as Record<
        string,
        JsonEncodable
      >;
      if ("error" in reconstructed.extraResponseFields) {
        delete reconstructed.extraResponseFields.error;
      }
    }
    return reconstructed;
  }
  // everything's good on this level, check below and cast
  if ("cause" in error) {
    if (error.cause === undefined || error.cause === null) {
      delete error.cause;
    } else {
      error.cause = toIBaseError(error.cause);
    }
  }
  return error as IBaseError;
}

export type BaseErrorOptions = Partial<{
  code: string;
  status: number;
  messages: (ValidationIssue | string)[];
  cause: unknown;
  sensitive: boolean;
  silent: boolean;
  extraResponseFields: ExtraResponseFields;
}>;

/**
 * A subclass of Error with a convienient constructor that allows for setting IBaseError properties
 *
 * Cause values will be reconstructed if they do not conform to the IBaseError interface.
 */
export class BaseError extends Error implements IBaseError {
  cause?: IBaseError;
  code?: string;
  status?: number;
  messages?: ValidationIssue[];
  sensitive?: boolean;
  silent?: boolean;
  extraResponseFields?: ExtraResponseFields;

  constructor(
    message: string,
    {
      code,
      status,
      messages,
      cause,
      sensitive,
      silent,
      extraResponseFields,
    }: BaseErrorOptions = {},
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.messages = messages?.map((issue) =>
      typeof issue === "string" ? { message: issue } : issue,
    );
    this.cause = cause === undefined ? undefined : toIBaseError(cause);
    this.sensitive = sensitive;
    this.silent = silent;
    this.extraResponseFields = extraResponseFields;
  }
}

/**
 * Result of error stack analysis
 */
export interface ErrorReport {
  /**
   * Message of the top-level error
   */
  message: string;
  /**
   * Most recently set error code in the stack
   *
   * 'E_UNEXPECTED_ERROR' is used if no error in the error cause chain defines a `code` property.
   */
  code: string;
  /**
   * Most recently set response status code
   *
   * 500 is used if no error in the error cause chain defines a `status` property.
   */
  status: number;
  /**
   * List of validation errors as most recently defined
   */
  validationIssues?: ValidationIssue[];
  /**
   * List of all error messages in the cause stack (starting from the top-level error)
   */
  causeStack: string[];
  /**
   * Stack trace of the root cause error (bottom of the stack)
   */
  rootStackTrace: string[];
  /**
   * Most recently set value of the sensitive property
   */
  sensitive: boolean;
  /**
   * Most recently set value of the silent property
   */
  silent: boolean;
  /**
   * Final extra response field set
   */
  extraResponseFields: ExtraResponseFields;
}

export function analyzeErrorStack(topError: IBaseError): ErrorReport {
  let currentError: IBaseError = topError;
  let lastStack: string | undefined;
  const result: Partial<ErrorReport> & {
    causeStack: string[];
    extraResponseFields: Record<string, JsonEncodable>;
  } = {
    causeStack: [],
    extraResponseFields: {},
  };
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- so what, i can't even have an infinite loop now? literally 1984
  while (true) {
    result.causeStack.push(currentError.message);
    result.status ??= currentError.status;
    result.code ??= currentError.code;
    result.validationIssues ??= currentError.messages;
    result.sensitive ??= currentError.sensitive;
    result.silent ??=
      currentError.silent ??
      (currentError.status !== undefined
        ? currentError.status < 500
        : undefined);
    lastStack = currentError.stack ?? lastStack;
    if (currentError.extraResponseFields !== undefined) {
      for (const [key, value] of Object.entries(
        currentError.extraResponseFields,
      )) {
        if (key !== "error" && !(key in result.extraResponseFields)) {
          result.extraResponseFields[key] = value;
        }
      }
    }
    if (currentError.cause === undefined) {
      break;
    }
    currentError = currentError.cause;
  }
  const cwd = process.cwd();
  return {
    message: topError.message,
    status: result.status ?? 500,
    code: result.code ?? "E_UNEXPECTED_ERROR",
    validationIssues: result.validationIssues,
    causeStack: result.causeStack,
    sensitive: result.sensitive ?? false,
    silent: result.silent ?? false,
    rootStackTrace:
      lastStack?.split("\n").flatMap((line) => {
        line = line.trim();
        if (!line.startsWith("at ")) {
          return [];
        }
        return (
          line
            // each stack trace line starts with "at", trim that
            .replace(/^at\s+/, "")
            // strip the file:// protocol in file paths
            .replace("file://", "")
            // cwd + node_modules => external dependency, trim out the path leaving the package name at the start
            .replace(`${cwd}/node_modules/`, "")
            // replace cwd with . to make the path relative
            .replace(cwd, ".")
        );
      }) ?? [],
    extraResponseFields: result.extraResponseFields,
  };
}

interface PrepareErrorOptions {
  includeCodeAndStatus: boolean;
}

const defaultPrepareErrorOptions: PrepareErrorOptions = {
  includeCodeAndStatus: true,
};

export function prepareReportForLogging(
  report: ErrorReport,
  opts = defaultPrepareErrorOptions,
): string {
  return [
    report.message,
    ...(opts.includeCodeAndStatus
      ? [`Error code: ${report.code}, status: ${report.status}`]
      : []),
    "Cause stack:",
    ...report.causeStack.map((c) => `    ${c}`),
    "Root stack trace:",
    ...report.rootStackTrace.map((f) => `    ${f}`),
  ].join("\n");
}

export interface ErrorResponse {
  error: SerializedErrorReport;
}

/**
 * A representation of the server error stack, as serialized to a JSON response
 */
export interface SerializedErrorReport {
  /**
   * Message of the top-level error
   */
  message: string;
  /**
   * Most recently set error code in the error stack
   *
   * This value is derived by traversing the error stack, from the top-level error, down the error cause chain.
   * The first `code` field defined on an error becomes the value of this property.
   * 'E_UNEXPECTED_ERROR' is used if no error in the error cause chain defines a `code` property.
   */
  code: string;
  /**
   * List of validation errors for 'E_VALIDATION_ERROR' errors.
   */
  validationIssues?: ValidationIssue[];
  /**
   * Error message of each error cause in the error stack, ordered from top to bottom of the stack
   *
   * Includes the top-level error message as the first item.
   * Will be undefined if the first error in the stack that defines a `sensitive` property has it set to `true`.
   * This is intended to be used for errors that should intentionally be left opaque for security purposes, such as errors from auth endpoints.
   * "Sensitive" errors will still be fully logged.
   */
  causeStack?: string[];
  /**
   * Stack trace of the deepest error in the cause stack (the root error cause)
   *
   * Not available in production.
   */
  rootStackTrace?: string[];
}
