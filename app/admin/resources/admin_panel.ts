import { LucidResource } from "@adminjs/adonis";

import User from "#models/user";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "Admin Panel",
};

const userResource = {
  resource: new LucidResource(User, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const adminPanelResources = [userResource];
