import BaseController, {
  CreateHookContext,
  DeleteHookContext,
  HookContext,
  PartialModel,
} from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import CalendarEvent from "#models/calendar_event";

export default class EventCalendarController extends BaseController<
  typeof CalendarEvent
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = CalendarEvent;

  protected async storeHook(
    ctx: CreateHookContext<typeof CalendarEvent>,
  ): Promise<PartialModel<typeof CalendarEvent> | void | undefined> {
    const event = ctx.request as CalendarEvent;
    if (event.endTime.diff(event.startTime).milliseconds <= 0) {
      throw new BadRequestException("End time must be after start time");
    }
    return undefined;
  }

  protected async updateHook(
    ctx: HookContext<typeof CalendarEvent>,
  ): Promise<PartialModel<typeof CalendarEvent> | void | undefined> {
    const changes = ctx.request as Partial<CalendarEvent>;
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
}
