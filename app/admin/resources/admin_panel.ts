import { LucidResource } from "@adminjs/adonis";

import User from "#models/user";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "Admin Panel",
  icon: "Terminal",
};

const userResource = {
  resource: new LucidResource(User, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
      resetPasswordToken: {
        isVisible: false,
      },
      resetPasswordTokenExpiration: {
        isVisible: false,
      },
    },
  },
};

export const adminPanelResources = [userResource];
