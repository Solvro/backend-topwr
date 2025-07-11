import User from "#models/user";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "adminNavigation",
  icon: "Terminal",
};

export const AdminPanelBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: User,
      additionalProperties: {
        resetPasswordToken: {
          isVisible: false,
        },
        resetPasswordTokenExpiration: {
          isVisible: false,
        },
      },
    },
  ],
  navigation,
};
