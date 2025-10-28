import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { RouteConfigurationOptions } from "#controllers/base_controller";
import FirebaseTopic from "#models/firebase_topic";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const topicToggleParamSchema = vine.object({
  activate: vine.boolean(),
});

const topicStateParamSchema = vine.object({
  deactivatedSince: vine.luxonDateTime().before(DateTime.now()),
});

export default class FirebaseTopicController extends BaseController<
  typeof FirebaseTopic
> {
  $configureRoutes(
    controller: LazyImport<Constructor<FirebaseTopicController>>,
    _?: RouteConfigurationOptions,
  ) {
    super.$configureRoutes(controller, {
      skipRoutes: {
        index: true,
        destroy: true,
      },
    });
    router.put("/toggle/:id", [controller, "toggleTopicState"]).as("toggle");
    router.get("/state", [controller, "indexTopicState"]).as("indexState");
  }

  async toggleTopicState({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string };
    };
    const { activate } = await vine.validate({
      schema: topicToggleParamSchema,
      data: { activate: request.input("activate", "false") === "true" },
    });
    const fbTopic = await this.getFirstOrFail(id);
    if (activate) {
      fbTopic.activateTopic();
    } else {
      fbTopic.deactivateTopic();
    }
    await this.saveOrFail(fbTopic);
  }

  async indexTopicState({ request }: HttpContext) {
    const { deactivatedSince } = await vine.validate({
      schema: topicStateParamSchema,
      data: {
        deactivatedSince: request.input("deactivatedSince", "") as string,
      },
    });
    return await FirebaseTopic.getTopicState(deactivatedSince);
  }

  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = FirebaseTopic;
}
