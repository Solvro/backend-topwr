import vine from "@vinejs/vine";

export const paginationValidator = vine.compile(
  vine.object({
    page: vine
      .number()
      .min(1)
      .withoutDecimals()
      .parse((value) => {
        return value === "" ? undefined : value;
      })
      .optional(),
    limit: vine
      .number()
      .min(1)
      .withoutDecimals()
      .parse((value) => {
        return value === "" ? undefined : value;
      })
      .optional(),
  }),
);
