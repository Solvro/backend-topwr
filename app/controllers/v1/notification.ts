import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { RouteConfigurationOptions } from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import PushNotificationEntry from "#models/push_notification_entry";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const topicBelongingValidator = vine.compile(
  vine.object({
    include: vine.array(vine.string()).notEmpty().optional(),
    exclude: vine.array(vine.string()).notEmpty().optional(),
  }),
);

export default class NotificationController extends BaseController<
  typeof PushNotificationEntry
> {
  $configureRoutes(
    controller: LazyImport<Constructor<NotificationController>>,
    _?: RouteConfigurationOptions,
  ) {
    router.group(() => {
      super.$configureRoutes(controller, {
        skipRoutes: {
          index: true,
          store: true,
          update: true,
          destroy: true,
        },
      });
      router.post("/", [controller, "getByTopic"]).as("index");
    });
  }

  async getByTopic({ request }: HttpContext) {
    const { include, exclude } = await request.validateUsing(
      topicBelongingValidator,
    );
    // Reject overlaps
    const includeSet = new Set(include ?? []);
    if (exclude !== undefined && includeSet.size > 0) {
      // Both include and exclude are given
      for (const topic of exclude) {
        if (includeSet.has(topic)) {
          throw new BadRequestException(
            `Topic ${topic} is included in both include and exclude`,
          );
        }
      }
    }
    // Fetch
    return await PushNotificationEntry.getByTopic(include, exclude);
  }

  protected readonly queryRelations = ["topics"];
  protected readonly crudRelations = [];
  protected readonly model = PushNotificationEntry;
}
