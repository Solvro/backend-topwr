import { LucidResource } from "@adminjs/adonis";

import Contributor from "#models/contributor";
import ContributorSocialLink from "#models/contributor_social_link";
import Milestone from "#models/milestone";

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
