import { changeTypeEnumsValues } from "#enums/change_type";
import { linkTypeEnumsValues } from "#enums/link_type";
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
  name: "Versions",
  icon: "GitBranch",
};

export const VersionsBuilder: ResourceBuilder = {
  builders: [
    { forModel: Change, additionalProperties: { type: changeTypeEnumsValues } },
    {
      forModel: ContributorSocialLink,
      additionalProperties: { linkType: linkTypeEnumsValues },
    },
    { forModel: ChangeScreenshot },
    {
      forModel: Contributor,
      addImageHandlingForProperties: ["photoKey"],
    },
    { forModel: Milestone },
    { forModel: Role },
    { forModel: Version },
    {
      forModel: VersionScreenshot,
      addImageHandlingForProperties: ["imageKey"],
    },
  ],
  navigation,
};
