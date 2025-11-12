import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import type PermissionsControllerType from "#controllers/permissions_controller";

export default class PermissionsRoutesController {
  $configureRoutes(
    controller: LazyImport<Constructor<PermissionsControllerType>>,
  ) {
    router
      .group(() => {
        router.post("/allow", [controller, "allow"]).as("allow");
        router.post("/revoke", [controller, "revoke"]).as("revoke");
        router.get("/list", [controller, "listUserPermissions"]).as("list");
      })
      .prefix("/permissions");
  }
}
