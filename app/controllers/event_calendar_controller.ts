import { errors } from "@vinejs/vine";
import { DateTime } from "luxon";

import { HttpContext } from "@adonisjs/core/http";

import { BadRequestException } from "#exceptions/http_exceptions";
import CalendarEvent from "#models/calendar_event";
import EventCalendarService, {
  calendarEventSchemaCompiler,
} from "#services/event_calendar_service";

export default class EventCalendarController {
  private static validateDateTime(dateString: string) {
    const dt = DateTime.fromISO(dateString);
    if (!dt.isValid) {
      throw new BadRequestException("Invalid date param");
    }
    return dt;
  }

  async index({ request }: HttpContext) {
    await EventCalendarService.startUpdatingEvents();
    const qs = request.qs();
    const excludeGoogleEvents = qs.excludeGoogleEvents === "true";
    const dateFrom: DateTime<true> | undefined =
      qs.dateFrom !== undefined
        ? EventCalendarController.validateDateTime(qs.dateFrom as string)
        : undefined;
    const dateTo: DateTime<true> | undefined =
      qs.dateTo !== undefined
        ? EventCalendarController.validateDateTime(qs.dateTo as string)
        : undefined;
    return await EventCalendarService.getEvents(
      excludeGoogleEvents,
      dateFrom,
      dateTo,
    );
  }

  async find({ params }: HttpContext): Promise<CalendarEvent> {
    await EventCalendarService.startUpdatingEvents();
    const eventId = params.event_id as string;
    return await EventCalendarService.getEvent(eventId);
  }

  async edit({ params, request }: HttpContext): Promise<CalendarEvent> {
    const eventId = params.event_id as string;
    const body = request.body();
    const startTime =
      body.startTime !== undefined
        ? EventCalendarController.validateDateTime(body.startTime as string)
        : undefined;
    const endTime =
      body.endTime !== undefined
        ? EventCalendarController.validateDateTime(body.endTime as string)
        : undefined;
    return await EventCalendarService.editEvent(eventId, {
      ...body,
      startTime,
      endTime,
    });
  }

  async remove({ params, response }: HttpContext): Promise<void> {
    const eventId = params.event_id as string;
    await EventCalendarService.removeEvent(eventId);
    return response.noContent();
  }

  async create({ request, response }: HttpContext) {
    const editDto = request.body();
    try {
      const data = await calendarEventSchemaCompiler.validate(editDto);
      const result = await EventCalendarService.addEvent({
        ...data,
        startTime: EventCalendarController.validateDateTime(data.startTime),
        endTime: EventCalendarController.validateDateTime(data.endTime),
      });
      return response.created(result);
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return response.badRequest({
          errors: (error as { messages: string[] }).messages,
        });
      }
      throw error;
    }
  }
}
