import { test } from "@japa/runner";

import type { LucidModel } from "@adonisjs/lucid/types/model";

import AutoCrudController from "#app/controllers/auto_crud_controller";
import type { Scopes } from "#app/controllers/auto_crud_controller";
import { importAllControllers } from "#app/utils/controllers";

const controllerListing = await importAllControllers();

test.group("AutoCrudController self-checks", () => {
  for (const version of controllerListing) {
    for (const controller of version.controllers.values()) {
      if (!(controller.instance instanceof AutoCrudController)) {
        continue;
      }
      test(`v${controller.apiVersion}/${controller.name}`, async () => {
        const instance = controller.instance as AutoCrudController<
          LucidModel & Scopes<LucidModel>
        >;
        const result = await instance.doSelfValidate();
        if (result !== null) {
          throw new Error(result.messages?.map((x) => x.message).join("\n"));
        }
      });
    }
  }
});
