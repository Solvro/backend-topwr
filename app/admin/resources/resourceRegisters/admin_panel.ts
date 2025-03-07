import User from "#models/user";

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Admin Panel",
  icon: "Terminal",
};

export function setUpAdminPanel(): ResourceBuilder {
  const info: ResourceInfo[] = [{ forModel: User }];
  return {
    navigation,
    builders: info,
  };
}
