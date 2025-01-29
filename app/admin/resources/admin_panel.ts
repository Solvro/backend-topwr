import { LucidResource } from "@adminjs/adonis";

import User from "#models/user";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const userResource = {
  resource: new LucidResource(User, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const adminPanelResources = [userResource];
