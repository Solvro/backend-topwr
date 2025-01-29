import { LucidResource } from "@adminjs/adonis";

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

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "Versions",
};

const changeResource = {
  resource: new LucidResource(Change, "postgres"),
  options: {
    navigation,
    properties: {
      type: changeTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const changeScreenshotResource = {
  resource: new LucidResource(ChangeScreenshot, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const contributorResource = {
  resource: new LucidResource(Contributor, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const contributorSocialLinksResource = {
  resource: new LucidResource(ContributorSocialLink, "postgres"),
  options: {
    navigation,
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const milestoneResource = {
  resource: new LucidResource(Milestone, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const roleResource = {
  resource: new LucidResource(Role, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const versionResource = {
  resource: new LucidResource(Version, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const versionScreenshotResource = {
  resource: new LucidResource(VersionScreenshot, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const versionsResources = [
  changeResource,
  changeScreenshotResource,
  contributorResource,
  contributorSocialLinksResource,
  milestoneResource,
  roleResource,
  versionResource,
  versionScreenshotResource,
];
