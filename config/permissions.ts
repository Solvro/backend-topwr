import { Permissions } from "@holoyan/adonisjs-permissions/types";

export const permissionsConfig: Permissions = {
  tables: {
    roles: "access_roles",
    modelRoles: "model_roles",
    permissions: "permissions",
    modelPermissions: "model_permissions",
  },
  morphMaps: {
    roles: "roles",
    permissions: "permissions",
  },
  uuidSupport: false,
};
