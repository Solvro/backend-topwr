import User from "#models/user";

import { ResourceFactory, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Admin Panel",
  icon: "Terminal",
};

export function setUpAdminPanel() {
  const info: ResourceInfo[] = [{ forModel: User }];
  ResourceFactory.registerResource({
    navigation,
    builders: info,
  });
}
