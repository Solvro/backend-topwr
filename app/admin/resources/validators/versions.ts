import vine from "@vinejs/vine";

export const versionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    milestoneId: vine.number().min(1).withoutDecimals(),
    releaseDate: vine.date().optional(),
    description: vine.string().trim().optional(),
  }),
);
