import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";
import { ModelAttributes } from "@adonisjs/lucid/types/model";

import BaseController, {
  CreateHookContext,
  DeleteHookContext,
  HookContext,
  PartialModel,
} from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import CalendarEvent from "#models/calendar_event";

const hideToggleValidator = vine.compile(
  vine.object({
    hide: vine.boolean(),
    params: vine.object({
      gCalId: vine.string().maxLength(50),
    }),
  }),
);

const showHiddenValidator = vine.compile(
  vine.object({
    showHidden: vine.boolean().optional(),
  }),
);

export default class EventCalendarController extends BaseController<
  typeof CalendarEvent
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = CalendarEvent;

  $configureRoutes(
    controller: LazyImport<Constructor<BaseController<typeof CalendarEvent>>>,
  ) {
    super.$configureRoutes(controller);
    router
      .patch("/hide/:gCalId", [EventCalendarController, "toggleHideEvent"])
      .as("toggle_hide_event");
  }

  protected async storeHook(
    ctx: CreateHookContext<typeof CalendarEvent>,
  ): Promise<PartialModel<typeof CalendarEvent> | void | undefined> {
    const event = ctx.request as ModelAttributes<CalendarEvent>;
    if (event.endTime.diff(event.startTime).milliseconds <= 0) {
      throw new BadRequestException("End time must be after start time");
    }
    return undefined;
  }

  protected async updateHook(
    ctx: HookContext<typeof CalendarEvent>,
  ): Promise<PartialModel<typeof CalendarEvent> | void | undefined> {
    const changes = ctx.request;
    const current = ctx.record;
    if (current.isGoogleEvent) {
      throw new BadRequestException("Cannot edit Google calendar events");
    }
    const startTime = changes.startTime ?? current.startTime;
    const endTime = changes.endTime ?? current.endTime;
    if (endTime.diff(startTime).milliseconds <= 0) {
      throw new BadRequestException("End time must be after start time");
    }
    return undefined;
  }

  protected async destroyHook(
    ctx: DeleteHookContext<typeof CalendarEvent>,
  ): Promise<void> {
    const event = ctx.record;
    if (event.isGoogleEvent) {
      throw new BadRequestException("Cannot delete Google calendar events");
    }
    return undefined;
  }

  async toggleHideEvent({ request, response, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const {
      hide,
      params: { gCalId },
    } = await request.validateUsing(hideToggleValidator);
    const isAlreadyHidden =
      (await db
        .from("hidden_events")
        .where("google_cal_id", gCalId)
        .first()) !== null;
    if (hide) {
      if (isAlreadyHidden) {
        throw new BadRequestException(
          "Event of this Google Calendar Id is already hidden",
        );
      }
      await db.table("hidden_events").insert({ google_cal_id: gCalId }).exec();
    } else {
      if (!isAlreadyHidden) {
        throw new BadRequestException(
          "Event of this Google Calendar Id is not hidden",
        );
      }
      await db
        .from("hidden_events")
        .where("google_cal_id", gCalId)
        .delete()
        .exec();
    }
    response.status(204);
  }

  async index({ request }: HttpContext): Promise<unknown> {
    const { showHidden } = await showHiddenValidator.validate(request.qs());
    const data = (await super.index({ request } as HttpContext)) as {
      data: CalendarEvent[];
    };
    if (showHidden === true) {
      return data;
    }
    return {
      data: data.data.filter((event) => !event.hidden),
    };
  }
}
