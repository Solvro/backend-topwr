import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import {
  CreateHookContext,
  HookContext,
  PartialModel,
  RouteConfigurationOptions,
} from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import FirebaseTopic from "#models/firebase_topic";
import PushNotificationService from "#services/push_notification_service";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const topicStateParamSchema = vine.object({
  deactivatedSince: vine.luxonDateTime().before(DateTime.now()),
});

const pushDataValidator = vine.compile(
  vine.object({
    notification: vine.object({
      title: vine.string(),
      body: vine.string(),
      data: vine.record(vine.string()).optional(),
    }),
    topics: vine.array(vine.string()).notEmpty(),
  }),
);

export default class FirebaseController extends BaseController<
  typeof FirebaseTopic
> {
  $configureRoutes(
    controller: LazyImport<Constructor<FirebaseController>>,
    _?: RouteConfigurationOptions,
  ) {
    router
      .group(() => {
        super.$configureRoutes(controller, {
          skipRoutes: {
            destroy: true,
          },
        });
      })
      .prefix("/topics")
      .as("topics");
    router
      .get("/topics_overview", [controller, "getTopicOverview"])
      .as("topics.overview");
    router
      .post("/broadcast", [controller, "broadcastPushNotification"])
      .as("broadcast");
  }

  protected async storeHook(
    ctx: CreateHookContext<typeof FirebaseTopic>,
  ): Promise<PartialModel<typeof FirebaseTopic> | void | undefined> {
    if (ctx.request.isActive === false) {
      throw new BadRequestException(
        "why would you want to create a deactivated topic???",
      );
    }
  }

  protected async updateHook(
    ctx: HookContext<typeof FirebaseTopic>,
  ): Promise<PartialModel<typeof FirebaseTopic> | void | undefined> {
    const changes = ctx.request;
    FirebaseTopic.ensureStateValidity(changes);
  }

  async getTopicOverview({ request }: HttpContext) {
    const { deactivatedSince } = await vine.validate({
      schema: topicStateParamSchema,
      data: {
        deactivatedSince: request.input("deactivatedSince", "") as string,
      },
    });
    return await FirebaseTopic.getTopicOverview(deactivatedSince);
  }

  async broadcastPushNotification({ request, auth }: HttpContext) {
    await this.requireSuperUser(auth);

    const { notification, topics } =
      await request.validateUsing(pushDataValidator);
    const topicsWithoutDuplicates = new Set<string>(topics);
    const invalidTopics = await FirebaseTopic.verifyTopics(
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

  protected readonly queryRelations = ["notifications"];
  protected readonly crudRelations = [];
  protected readonly model = FirebaseTopic;
}
