import vine from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import User from "#models/user";

export const loginValidator = vine.compile(
  vine.object({
    // adonis doesnt actually require emails to be emails lol
    // requiring an email here breaks my local test account
    email: vine.string(),
    password: vine.string(),
  }),
);

export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string().minLength(1),
  }),
);

export const changePasswordValidator = (user: User) =>
  vine.compile(
    vine.object({
      oldPassword: vine.string().use(
        vine.createRule(
          async (value: unknown, _, field: FieldContext) => {
            if (!(await user.verifyPassword(value as string))) {
              field.report("Incorrect current password", "oldPassword", field);
            }
          },
          { isAsync: true },
        )(),
      ),
      newPassword: vine
        .string()
        .newPassword()
        .notSameAs("oldPassword")
        .confirmed({ confirmationField: "newPasswordConfirm" }),
    }),
  );
