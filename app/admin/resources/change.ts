import { LucidResource } from "@adminjs/adonis";

import Change from "#models/change";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const changeResource = {
  resource: new LucidResource(Change, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
