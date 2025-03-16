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

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Versions",
  icon: "GitBranch",
};

export function setUpVersions(): ResourceBuilder {
  const info: ResourceInfo[] = [
    { forModel: Change, additionalProperties: { type: changeTypeEnumsValues } },
    {
      forModel: ContributorSocialLink,
      additionalProperties: { linkType: linkTypeEnumsValues },
    },
    { forModel: ChangeScreenshot },
    { forModel: Contributor, addImageHandling: true },
    { forModel: Milestone },
    { forModel: Role },
    { forModel: Version },
    { forModel: VersionScreenshot, addImageHandling: true },
  ];
  return {
    navigation,
    builders: info,
  };
}
