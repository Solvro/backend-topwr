import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import {
  CreateHookContext,
  PartialModel,
  RouteConfigurationOptions,
} from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import FirebaseTopic, { TOPIC_NAME_REGEX } from "#models/firebase_topic";
import PushNotificationService from "#services/push_notification_service";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const topicToggleParamSchema = vine.object({
  activate: vine.boolean(),
});

const topicStateParamSchema = vine.object({
  deactivatedSince: vine.luxonDateTime().before(DateTime.now()),
});

const pushDataValidator = vine.compile(
  vine.object({
    notification: vine.object({
      title: vine.string(),
      body: vine.string(),
      data: vine.record(vine.string()),
    }),
    topics: vine.array(vine.string()).notEmpty(),
  }),
);

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
    router
      .patch("/topic/toggle/:id", [controller, "toggleTopicState"])
      .as("toggle");
    router.get("/topic/state", [controller, "indexTopicState"]).as("state");
    router
      .post("/notification/broadcast", [
        controller,
        "broadcastPushNotification",
      ])
      .as("broadcast");
  }

  protected async storeHook(
    ctx: CreateHookContext<typeof FirebaseTopic>,
  ): Promise<PartialModel<typeof FirebaseTopic> | void | undefined> {
    const name = ctx.model.name;
    if (!TOPIC_NAME_REGEX.test(name)) {
      throw new BadRequestException(
        `Topic name '${name}' is invalid. Must match ${TOPIC_NAME_REGEX.toString()}`,
      );
    }
    return undefined;
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

  async broadcastPushNotification({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const { notification, topics } =
      await request.validateUsing(pushDataValidator);
    const topicsWithoutDuplicates = new Set<string>(topics);
    const invalidTopics = await FirebaseTopic.getInvalidTopics(
      topicsWithoutDuplicates,
    );
    if (invalidTopics !== null) {
      // Some of the topics requested are invalid
      throw new BadRequestException(
        invalidTopics
          .entries()
          .reduce(
            (msg, [topic, _]) => `${msg} ${topic},`,
            "The following topics are either missing or deactivated: ",
          ),
      );
    }
    await PushNotificationService.sendPushNotification(
      notification,
      topicsWithoutDuplicates,
    );
  }

  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = FirebaseTopic;
}
