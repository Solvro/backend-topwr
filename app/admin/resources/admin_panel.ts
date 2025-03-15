import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import User from "#models/user";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import { userValidator } from "./validators/admin_panel.js";
import { validateResource } from "./validators/utils.js";

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
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(userValidator, request),
      },
    },
  },
};

export const adminPanelResources = [userResource];
