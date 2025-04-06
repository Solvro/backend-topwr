import vine from "@vinejs/vine";

export const userValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().optional(),
    email: vine.string().email(),
    password: vine.string().minLength(1),
  }),
);
