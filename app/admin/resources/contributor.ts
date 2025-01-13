import { LucidResource } from "@adminjs/adonis";

import Contributor from "#models/contributor";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const contributorResource = {
  resource: new LucidResource(Contributor, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
