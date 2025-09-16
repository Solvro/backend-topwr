import vine, { VineString } from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

function newPassword(value: unknown, _: unknown, field: FieldContext) {
  if (!vine.helpers.isString(value)) {
    return;
  }
  if (value.length < 8) {
    field.report(
      "The {{field}} field must have at least 8 characters",
      "newPasswordRule",
      field,
    );
  }
  if (/.*[a-z].*/.test(value) === false) {
    field.report(
      "The {{field}} field does not contain any lower case letter",
      "newPasswordRule",
      field,
    );
  }
  if (/.*[A-Z].*/.test(value) === false) {
    field.report(
      "The {{field}} field does not contain any upper case letter",
      "newPasswordRule",
      field,
    );
  }
  if (/.*[0-9].*/.test(value) === false) {
    field.report(
      "The {{field}} field does not contain any digit",
      "newPasswordRule",
      field,
    );
  }
}

const newPasswordRule = vine.createRule(newPassword);

declare module "@vinejs/vine" {
  interface VineString {
    newPassword(): this;
  }
}

VineString.macro("newPassword", function (this: VineString) {
  return this.use(newPasswordRule());
});

export const newPasswordValidator = vine.compile(
  vine.object({
    password: vine.string().newPassword(),
  }),
);
