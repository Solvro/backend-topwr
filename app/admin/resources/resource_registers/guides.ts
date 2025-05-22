import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Guides",
  icon: "Paperclip",
};

export const GuidesBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: GuideAuthor,
    },
    {
      forModel: GuideQuestion,
      additionalProperties: { answer: { type: "richtext" } },
      targetedByModels: [
        {
          ownerModel: GuideArticle,
        },
      ],
      isInManyToMany: true,
    },
    {
      forModel: GuideArticle,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandlingForProperties: ["imageKey"],
      ownedRelations: [
        {
          displayLabel: "Guide questions",
          relationDefinition: {
            targetModel: GuideQuestion,
          },
        },
        {
          displayLabel: "Guide authors",
          relationDefinition: {
            targetModel: GuideAuthor,
            additionalRelationColumnDefinition: [
              {
                columnName: "role",
                type: "string",
              },
            ],
            inverseJoinKeyType: "number",
            joinKeyType: "number",
          },
        },
      ],
    },
  ],
  navigation,
};
