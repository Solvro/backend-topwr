import { RelationType } from "@adminjs/relations";

import { changeTypeEnumsValues } from "#enums/change_type";
import { linkTypeAutodetectSetUp } from "#enums/link_type";
import Change from "#models/change";
import ChangeScreenshot from "#models/change_screenshot";
import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import VersionScreenshot from "#models/version_screenshot";
import {
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Versions",
  icon: "GitBranch",
};

export const VersionsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: Change,
      additionalProperties: { type: changeTypeEnumsValues },
      ownedRelations: [
        {
          displayLabel: "Change screenshots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(ChangeScreenshot),
              joinKey: getOneToManyRelationForeignKey(Change, "test"),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: ContributorSocialLink,
      ...linkTypeAutodetectSetUp,
      isRelationTarget: true,
    },
    {
      forModel: ChangeScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      isRelationTarget: true,
    },
    {
      forModel: Contributor,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
      ownedRelations: [
        {
          displayLabel: "Contributor social Links",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(ContributorSocialLink),
              joinKey: getOneToManyRelationForeignKey(Contributor, "test"),
            },
          },
        },
      ],
    },
    {
      forModel: Milestone,
      ownedRelations: [
        {
          displayLabel: "Versions",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(Version),
              joinKey: getOneToManyRelationForeignKey(Version, "test"),
            },
          },
        },
      ],
    },
    {
      forModel: Role,
    },
    {
      forModel: Version,
      ownedRelations: [
        {
          displayLabel: "Changes",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(Change),
              joinKey: getOneToManyRelationForeignKey(Version, "test"),
            },
          },
        },
        {
          displayLabel: "Version screenshots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(VersionScreenshot),
              joinKey: getOneToManyRelationForeignKey(Version, "test"),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: VersionScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      isRelationTarget: true,
    },
  ],
  navigation,
};
