import { LucidResource } from "@adminjs/adonis";

import User from "#models/user";

import { readOnlyTimestamps } from "./timestamps.js";

export const userResource = {
  resource: new LucidResource(User, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
