import vine from "@vinejs/vine";

export const showValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.number().min(1).withoutDecimals(),
    }),
  }),
);
