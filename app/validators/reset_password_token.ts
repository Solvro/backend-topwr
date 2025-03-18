import vine, { BaseLiteralType, VineString } from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import User from "#models/user";

const errorMessage = "Invalid reset token field";

export interface ResetToken {
  token: string;
  user: User;
  /**
   * Expiration based validity. false if reset password token expiration date is less than now
   */
  isValid: boolean;
}

const isValidToken = vine.createRule(
  async (value: unknown, _, field: FieldContext) => {
    if (!field.isValid) {
      return;
    }
    const token = value as string;
    if (!vine.helpers.isUUID(token, 4)) {
      field.report(errorMessage, "isValidToken", field);
      return;
    }
    const user = await User.query()
      .withScopes((scopes) => {
        scopes.compareTokens(token);
      })
      .first();
    if (user === null) {
      field.report(errorMessage, "isValidToken", field);
      return;
    }
    const output: ResetToken = {
      token,
      user,
      isValid: true,
    };
    if (user.hasValidResetToken()) {
      output.isValid = false;
    }
    field.mutate(output, field);
  },
  {
    isAsync: true,
  },
);

// inform ts
declare module "@vinejs/vine" {
  interface VineString {
    resetPasswordToken(): BaseLiteralType<string, ResetToken, ResetToken>;
  }
}

VineString.macro(
  "resetPasswordToken",
  function (this: BaseLiteralType<string, ResetToken, ResetToken>) {
    return this.use(isValidToken());
  },
);

/**
 * Will fail on invalid token formats OR no user assigned to the token.
 * Expiration date must be handled by checking `isValid()` method on output
 */
export const resetPasswordTokenValidator = vine.compile(
  vine.object({
    params: vine.object({
      token: vine.string().resetPasswordToken(),
    }),
  }),
);
