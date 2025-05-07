import { RelationType } from "@adminjs/relations";

import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";
import {
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

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
      isRelationTarget: true,
    },
    {
      forModel: GuideArticle,
      additionalProperties: { description: { type: "richtext" } },
      addImageHandlingForProperties: ["imageKey"],
      ownedRelations: [
        {
          displayLabel: "Guide questions",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(GuideQuestion),
              joinKey: getOneToManyRelationForeignKey(GuideArticle, "test"),
            },
          },
        },
      ],
    },
  ],
  navigation,
};
