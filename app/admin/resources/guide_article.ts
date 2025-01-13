import { LucidResource } from "@adminjs/adonis";

import GuideArticle from "#models/guide_article";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const guideArticleResources = {
  resource: new LucidResource(GuideArticle, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
