import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { ResourceFactory, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Guides",
  icon: "Paperclip",
};

export function setUpGuides() {
  const info: ResourceInfo[] = [
    { forModel: GuideAuthor },
    {
      forModel: GuideQuestion,
      additionalProperties: { answer: { type: "richtext" } },
    },
    {
      forModel: GuideArticle,
      additionalProperties: { description: { type: "richtext" } },
    },
  ];
  ResourceFactory.registerResource({
    navigation,
    builders: info,
  });
}
