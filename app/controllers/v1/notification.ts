import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { RouteConfigurationOptions } from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import PushNotificationEntry from "#models/push_notification_entry";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

// I give up on using built-in vine functions. Optional and transform cannot be used on union types for some reason.
const queryParamSchema = vine
  .any()
  .transform((value) => {
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      // vine.array(vine.string()).notEmpty()
      return value;
    } else if (typeof value === "string") {
      // vine.string().transform(value => [value])
      return [value];
    }
    return undefined;
  })
  .optional();

const topicBelongingValidator = vine.object({
  include: queryParamSchema,
  exclude: queryParamSchema,
});

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
      router.get("/", [controller, "getByTopic"]).as("index");
    });
  }

  async getByTopic({ request }: HttpContext) {
    const { include, exclude } = await vine.validate({
      schema: topicBelongingValidator,
      data: request.only(["include", "exclude"]),
    });
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
