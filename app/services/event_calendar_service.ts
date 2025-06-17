import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import {
  BadRequestException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import CalendarEvent from "#models/calendar_event";

export interface CalendarEventDto {
  startTime: DateTime<true>;
  endTime: DateTime<true>;
  name: string;
  location: string | null;
  description: string | null;
}

const calendarEventSchema = vine.object({
  startTime: vine.string(),
  endTime: vine.string(),
  name: vine.string(),
  location: vine.string().nullable(),
  description: vine.string().nullable(),
});

export const calendarEventSchemaCompiler = vine.compile(calendarEventSchema);

export default class EventCalendarService {
  public static async addEvent(event: CalendarEventDto) {
    if (event.startTime > event.endTime) {
      throw new BadRequestException("End time must be after start time");
    }
    return await CalendarEvent.create(event);
  }

  public static async getEvent(eventId: string): Promise<CalendarEvent> {
    const event = await CalendarEvent.find(eventId);
    if (event === null) {
      throw new NotFoundException("Event not found");
    }
    return event;
  }

  public static getEvents(
    excludeGoogleEvents = false,
    dateFrom?: DateTime<true>,
    dateTo?: DateTime<true>,
  ): Promise<CalendarEvent[]> {
    let query = CalendarEvent.query();
    if (excludeGoogleEvents) {
      query = query.whereNull("google_cal_id");
    }
    if (dateFrom !== undefined) {
      query = query.where("start_time", ">=", dateFrom.toISO());
    }
    if (dateTo !== undefined) {
      query = query.where("start_time", "<=", dateTo.toISO());
    }
    return query.exec();
  }

  public static async removeEvent(eventId: string) {
    const event = await CalendarEvent.find(eventId);
    if (event === null) {
      throw new NotFoundException("Event not found");
    }
    if (event.isGoogleEvent) {
      throw new BadRequestException("Cannot delete a google calendar event");
    }
    await event.delete();
  }

  public static async editEvent(
    eventId: string,
    event: Partial<CalendarEventDto>,
  ) {
    const eventToEdit = await CalendarEvent.find(eventId);
    if (eventToEdit === null) {
      throw new NotFoundException("Event not found");
    }
    if (eventToEdit.isGoogleEvent) {
      throw new BadRequestException("Cannot edit a google calendar event");
    }
    let anyChange = false;
    if (event.startTime !== undefined) {
      eventToEdit.startTime = event.startTime;
      anyChange = true;
    }
    if (event.endTime !== undefined) {
      eventToEdit.endTime = event.endTime;
      anyChange = true;
    }
    if (eventToEdit.startTime > eventToEdit.endTime) {
      throw new BadRequestException("End time must be after start time");
    }
    if (event.name !== undefined) {
      eventToEdit.name = event.name;
      anyChange = true;
    }
    if (event.location !== undefined) {
      eventToEdit.location = event.location;
      anyChange = true;
    }
    if (event.description !== undefined) {
      eventToEdit.description = event.description;
      anyChange = true;
    }
    if (anyChange) {
      return await eventToEdit.save();
    } else {
      throw new BadRequestException("No changes provided");
    }
  }
}
