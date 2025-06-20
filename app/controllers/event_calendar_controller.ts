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
    const event = ctx.request as unknown as CalendarEvent;
    if (event.endTime.diff(event.startTime).milliseconds <= 0) {
      throw new BadRequestException("End time must be after start time");
    }
    return undefined;
  }

  protected async updateHook(
    ctx: HookContext<typeof CalendarEvent>,
  ): Promise<PartialModel<typeof CalendarEvent> | void | undefined> {
    const changes = ctx.request as unknown as Partial<CalendarEvent>;
    const current = ctx.record as unknown as CalendarEvent;
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
    const event = ctx.record as unknown as CalendarEvent;
    if (event.isGoogleEvent) {
      throw new BadRequestException("Cannot delete Google calendar events");
    }
    return undefined;
  }
  // private static validateDateTime(dateString: string) {
  //   const dt = DateTime.fromISO(dateString);
  //   if (!dt.isValid) {
  //     throw new BadRequestException("Invalid date param");
  //   }
  //   return dt;
  // }
  //
  // async index({ request }: HttpContext) {
  //   const qs = request.qs();
  //   const excludeGoogleEvents = qs.excludeGoogleEvents === "true";
  //   const dateFrom: DateTime<true> | undefined =
  //     qs.dateFrom !== undefined
  //       ? EventCalendarController.validateDateTime(qs.dateFrom as string)
  //       : undefined;
  //   const dateTo: DateTime<true> | undefined =
  //     qs.dateTo !== undefined
  //       ? EventCalendarController.validateDateTime(qs.dateTo as string)
  //       : undefined;
  //   return await EventCalendarService.getEvents(
  //     excludeGoogleEvents,
  //     dateFrom,
  //     dateTo,
  //   );
  // }
  //
  // async find({ params }: HttpContext): Promise<CalendarEvent> {
  //   const eventId = params.event_id as string;
  //   return await EventCalendarService.getEvent(eventId);
  // }
  //
  // async edit({ params, request }: HttpContext): Promise<CalendarEvent> {
  //   const eventId = params.event_id as string;
  //   const body = request.body();
  //   const startTime =
  //     body.startTime !== undefined
  //       ? EventCalendarController.validateDateTime(body.startTime as string)
  //       : undefined;
  //   const endTime =
  //     body.endTime !== undefined
  //       ? EventCalendarController.validateDateTime(body.endTime as string)
  //       : undefined;
  //   return await EventCalendarService.editEvent(eventId, {
  //     ...body,
  //     startTime,
  //     endTime,
  //   });
  // }
  //
  // async remove({ params, response }: HttpContext): Promise<void> {
  //   const eventId = params.event_id as string;
  //   await EventCalendarService.removeEvent(eventId);
  //   return response.noContent();
  // }
  //
  // async create({ request, response }: HttpContext) {
  //   const editDto = request.body();
  //   try {
  //     const data = await calendarEventSchemaCompiler.validate(editDto);
  //     const result = await EventCalendarService.addEvent({
  //       ...data,
  //       startTime: EventCalendarController.validateDateTime(data.startTime),
  //       endTime: EventCalendarController.validateDateTime(data.endTime),
  //     });
  //     return response.created(result);
  //   } catch (error) {
  //     if (error instanceof errors.E_VALIDATION_ERROR) {
  //       return response.badRequest({
  //         errors: (error as { messages: string[] }).messages,
  //       });
  //     }
  //     throw error;
  //   }
  // }
}
