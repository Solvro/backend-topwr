import { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor } from "@adonisjs/core/types/container";
import { LazyImport } from "@adonisjs/core/types/http";

import BaseController from "#controllers/base_controller";
import MobileConfig from "#models/mobile_config";

export default class MobileConfigController extends BaseController<
  typeof MobileConfig
> {
  protected queryRelations: string[] = [];
  protected crudRelations: string[] = [];
  protected model: typeof MobileConfig = MobileConfig;
  protected singletonId = 1;

  $configureRoutes(
    controller: LazyImport<Constructor<BaseController<typeof MobileConfig>>>,
  ) {
    super.$configureRoutes(controller);
    router.post("/bump", [MobileConfigController, "bump"]).as("bump");
  }

  async bump({ auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await MobileConfig.bumpCache();
  }
}
