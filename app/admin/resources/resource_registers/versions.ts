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

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "versionsNavigation",
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
          relationDefinition: {
            targetModel: ChangeScreenshot,
            targetModelPlural_camelCase: "screenshots",
          },
        },
      ],
      targetedByModels: [
        {
          ownerModel: Version,
        },
      ],
    },
    {
      forModel: ContributorSocialLink,
      ...linkTypeAutodetectSetUp,
      targetedByModels: [
        {
          ownerModel: Contributor,
        },
      ],
    },
    {
      forModel: ChangeScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      targetedByModels: [
        {
          ownerModel: Change,
        },
      ],
    },
    {
      forModel: Contributor,
      addImageHandlingForProperties: ["photoKey"],
      ownedRelations: [
        {
          displayLabel: "Contributor social Links",
          relationDefinition: {
            targetModel: ContributorSocialLink,
            targetModelPlural_camelCase: "socialLinks",
          },
        },
      ],
    },
    {
      forModel: Milestone,
      ownedRelations: [
        {
          displayLabel: "Versions",
          relationDefinition: {
            targetModel: Version,
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
          relationDefinition: {
            targetModel: Change,
          },
        },
        {
          displayLabel: "Version screenshots",
          relationDefinition: {
            targetModel: VersionScreenshot,
            targetModelPlural_camelCase: "screenshots",
          },
        },
      ],
      targetedByModels: [
        {
          ownerModel: Milestone,
        },
      ],
    },
    {
      forModel: VersionScreenshot,
      addImageHandlingForProperties: ["imageKey"],
      targetedByModels: [
        {
          ownerModel: Version,
        },
      ],
    },
  ],
  navigation,
};
