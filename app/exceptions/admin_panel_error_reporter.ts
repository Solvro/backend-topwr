import { SimpleErrorReporter } from "@vinejs/vine";
import { ValidationError } from "adminjs";

export class AdminPanelErrorReporter extends SimpleErrorReporter {
  // just to convince TS to let me change the return type
  createError(): never;
  createError(): ValidationError {
    const errors = Object.fromEntries(
      this.errors.map(({ message, field, rule }) => {
        return [field, { message, type: rule }];
      }),
    );
    return new ValidationError(errors);
  }
}
