import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import {
  guideArticleValidator,
  guideAuthorValidator,
  guideQuestionValidator,
} from "./validators/guide.js";
import { validateResource } from "./validators/utils.js";

const navigation = {
  name: "Guides",
  icon: "Paperclip",
};

const guideArticleResource = {
  resource: new LucidResource(GuideArticle, "postgres"),
  options: {
    navigation,
    properties: {
      description: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(guideArticleValidator, request),
      },
    },
  },
};

const guideAuthorResource = {
  resource: new LucidResource(GuideAuthor, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(guideAuthorValidator, request),
      },
    },
  },
};

const guideQuestionResource = {
  resource: new LucidResource(GuideQuestion, "postgres"),
  options: {
    navigation,
    properties: {
      answer: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(guideQuestionValidator, request),
      },
    },
  },
};

export const guidesResources = [
  guideArticleResource,
  guideAuthorResource,
  guideQuestionResource,
];
