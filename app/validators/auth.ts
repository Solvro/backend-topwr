import vine from "@vinejs/vine";

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
