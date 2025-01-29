import { LucidResource } from "@adminjs/adonis";

import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const guideArticleResource = {
  resource: new LucidResource(GuideArticle, "postgres"),
  options: {
    properties: {
      description: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
  },
};

export const guideAuthorResource = {
  resource: new LucidResource(GuideAuthor, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const guideQuestionResource = {
  resource: new LucidResource(GuideQuestion, "postgres"),
  options: {
    properties: {
      answer: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
  },
};
