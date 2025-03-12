import vine, { BaseLiteralType, VineString } from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import User from "#models/user";

const errorMessage = "Invalid {{field}} field";

interface ValidTokenOutput {
  validToken: string;
  userWithToken: User;
}

export const isValidToken = vine.createRule(
  async (value: unknown, _, field: FieldContext) => {
    if (!vine.helpers.isString(value)) {
      field.report(errorMessage, "isValidToken", field);
      return;
    }
    if (!vine.helpers.isUUID(value, 4)) {
      field.report(errorMessage, "isValidToken", field);
      return;
    }
    const userInstance = await User.query()
      .withScopes((scopes) => {
        scopes.compareTokens(value);
      })
      .first();
    if (userInstance === null) {
      field.report(errorMessage, "isValidToken", field);
      return;
    }
    const output: ValidTokenOutput = {
      validToken: value,
      userWithToken: userInstance,
    };
    field.mutate(output, field);
  },
  {
    isAsync: true,
  },
);

declare module "@vinejs/vine" {
  interface VineString {
    resetPasswordToken(): BaseLiteralType<
      string,
      ValidTokenOutput,
      ValidTokenOutput
    >;
  }
}

VineString.macro(
  "resetPasswordToken",
  function (this: BaseLiteralType<string, ValidTokenOutput, ValidTokenOutput>) {
    return this.use(isValidToken());
  },
);

export const resetPasswordTokenValidator = vine.compile(
  vine.object({
    params: vine.object({
      token: vine.string().resetPasswordToken(),
    }),
  }),
);
