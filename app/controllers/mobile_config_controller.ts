import { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import BaseController from "#controllers/base_controller";
import MobileConfig from "#models/mobile_config";

// Local constructor alias to avoid depending on internal core types
type Ctor<T> = new (...args: any[]) => T;

export default class MobileConfigController extends BaseController<
  typeof MobileConfig
> {
  protected queryRelations: string[] = [];
  protected crudRelations: string[] = [];
  protected model: typeof MobileConfig = MobileConfig;
  protected singletonId = 1;

  $configureRoutes(
    controller: LazyImport<Ctor<BaseController<typeof MobileConfig>>>,
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
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await MobileConfig.bumpCmsCache();
  }

  async bumpTranslator({ auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await MobileConfig.bumpTranslatorCache();
  }
}
