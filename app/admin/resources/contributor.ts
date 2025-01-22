import { LucidResource } from "@adminjs/adonis";

import { LinkType } from "#enums/link_type";
import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";
import Role from "#models/role";
import Version from "#models/version";
import VersionScreenshot from "#models/version_screenshot";

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
      linkType: {
        availableValues: [
          { value: LinkType.Default, label: "Default" },
          { value: LinkType.Facebook, label: "Facebook" },
          { value: LinkType.Instagram, label: "Instagram" },
          { value: LinkType.LinkedIn, label: "LinkedIn" },
          { value: LinkType.Mail, label: "Mail" },
          { value: LinkType.YouTube, label: "YouTube" },
          { value: LinkType.GitHub, label: "GitHub" },
          { value: LinkType.TopwrBuildings, label: "TopwrBuildings" },
          { value: LinkType.Phone, label: "Phone" },
          { value: LinkType.X, label: "X" },
          { value: LinkType.TikTok, label: "TikTok" },
          { value: LinkType.Discord, label: "Discord" },
          { value: LinkType.Twitch, label: "Twitch" },
        ],
      },
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
