import { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { LazyImport } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";

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
    router
      .post("/bump/cms", [MobileConfigController, "bumpCms"])
      .as("bump.cms");
    router
      .post("/bump/translator", [MobileConfigController, "bumpTranslator"])
      .as("bump.translator");
  }

  async bumpCms({ auth }: HttpContext) {
    await this.requireSuperUser(auth);
    await MobileConfig.bumpCmsCache();
  }

  async bumpTranslator({ auth }: HttpContext) {
    await this.requireSuperUser(auth);
    await MobileConfig.bumpTranslatorCache();
  }
}
