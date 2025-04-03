import vine from "@vinejs/vine";

export const emailValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  }),
);
