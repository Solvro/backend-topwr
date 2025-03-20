import { BaseError, BaseErrorOptions } from "./base_error.js";

type ContextSpec =
  | string
  | ({ message: string } & Omit<BaseErrorOptions, "cause">);

declare global {
  interface Promise<T> {
    /**
     * Wraps the error (if any) in a BaseError, as defined by the ContextSpec
     *
     * The `context` argument may be a value or a function; functions will be lazily evaluated only if an error is thrown
     */
    addErrorContext(context: ContextSpec | (() => ContextSpec)): Promise<T>;
  }
}

globalThis.Promise.prototype.addErrorContext = function <T>(
  this: Promise<T>,
  context: ContextSpec | (() => ContextSpec),
): Promise<T> {
  return this.catch((error) => {
    if (typeof context === "function") {
      context = context();
    }
    if (typeof context === "string") {
      return Promise.reject(new BaseError(context, { cause: error }));
    }
    return Promise.reject(
      new BaseError(context.message, { ...context, cause: error }),
    );
  });
};

export {};
