import vine from "@vinejs/vine";

export const guideArticleValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    shortDesc: vine.string().trim().minLength(1),
    description: vine.string().trim().minLength(1),
    imagePath: vine.string().trim().minLength(1),
  }),
);

export const guideAuthorValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
  }),
);

export const guideQuestionValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    answer: vine.string().trim().minLength(1),
    articleId: vine.number().min(0),
  }),
);
