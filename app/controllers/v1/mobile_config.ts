import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import type { Constructor, LazyImport } from "@adonisjs/core/types/http";

import AutoCrudController from "#controllers/auto_crud_controller";
import MobileConfig from "#models/mobile_config";

export default class MobileConfigController extends AutoCrudController<
  typeof MobileConfig
> {
  protected queryRelations: string[] = [];
  protected crudRelations: string[] = [];
  protected model: typeof MobileConfig = MobileConfig;
  protected singletonId = 1;

  $configureRoutes(
    controller: LazyImport<
      Constructor<AutoCrudController<typeof MobileConfig>>
    >,
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
