import { LucidResource } from "@adminjs/adonis";

import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const guideArticleResource = {
  resource: new LucidResource(GuideArticle, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const guideAutherResource = {
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
      ...readOnlyTimestamps,
    },
  },
};
