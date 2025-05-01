import { RelationType } from "@adminjs/relations";

import GuideArticle from "#models/guide_article";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

const navigation = {
  name: "Guides",
  icon: "Paperclip",
};

export const GuidesBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: GuideAuthor,
      // {
      //   displayLabel: "Student Organization Tags",
      //   relation: {
      //     type: RelationType.ManyToMany,
      //     junction: {
      //       joinKey: StudentOrganization.getTagsJoinKey(),
      //       inverseJoinKey: StudentOrganizationTag.getStudentOrganizationInverseJoinKey(),
      //       throughResourceId: normalizeResourceName(StudentOrganization)
      //     },
      //     target: {
      //       resourceId: normalizeResourceName(StudentOrganizationTag),
      //     },
      //   },
      // },
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
              resourceId: normalizeResourceName(GuideQuestion),
              joinKey: GuideQuestion.getGuideArticleRelationKey(),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
  ],
  navigation,
};
