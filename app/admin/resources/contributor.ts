import { LucidResource } from "@adminjs/adonis";

import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import VersionScreenshot from "#models/version_screenshot";

import { linkTypeEnumsValues } from "./utils/link_type.js";
import { readOnlyTimestamps } from "./utils/timestamps.js";

export const contributorResource = {
  resource: new LucidResource(Contributor, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const contributorSocialLinksResource = {
  resource: new LucidResource(ContributorSocialLink, "postgres"),
  options: {
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

export const milestoneResource = {
  resource: new LucidResource(Milestone, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const roleResource = {
  resource: new LucidResource(Role, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const versionResource = {
  resource: new LucidResource(Version, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const versionScreenshotResource = {
  resource: new LucidResource(VersionScreenshot, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
