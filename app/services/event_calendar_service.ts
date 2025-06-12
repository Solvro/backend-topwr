import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import logger from "@adonisjs/core/services/logger";

import {
  BadRequestException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import CalendarEvent from "#models/calendar_event";

const FETCH_LIMIT_DAYS = 30;
const CALENDAR_ID = "9ke30hbjjke60u5jbii42g2rpo@group.calendar.google.com";
const FIELD_LABELS = [
  "DTSTART",
  "DTEND",
  "UID",
  "DESCRIPTION",
  "LOCATION",
  "SUMMARY",
]; //do not reorder the labels - the order must match the .isc file order

interface GoogleCalendarEventDto {
  googleCalId: string;
  startTime: DateTime<true>;
  endTime: DateTime<true>;
  name: string;
  location: string | null;
  description: string | null;
}

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

class CalendarParser {
  private cursor: number;

  constructor(private calendarString: string) {
    if (
      !this.calendarString.startsWith("BEGIN:VCALENDAR") ||
      !this.calendarString.trimEnd().endsWith("END:VCALENDAR")
    ) {
      throw new Error("Calendar invalid");
    }
    this.cursor = calendarString.length - 16;
  }

  public getLastEvent(): GoogleCalendarEventDto | null {
    let event = this.extractLastEvent();
    while (event === undefined) {
      event = this.extractLastEvent();
    }
    return event;
  }

  //null - none left, undefined - malformed event
  private extractLastEvent(): GoogleCalendarEventDto | null | undefined {
    const eventEnd = this.calendarString.lastIndexOf("END:VEVENT", this.cursor);
    if (eventEnd === -1) {
      return null;
    }
    const eventBegin = this.calendarString.lastIndexOf(
      "BEGIN:VEVENT",
      eventEnd,
    );
    if (eventBegin === -1) {
      return undefined;
    }
    const eventBlock = this.calendarString.substring(eventBegin, eventEnd + 10);
    this.cursor = eventBegin;
    return CalendarParser.parseEvent(eventBlock);
  }

  private static parseEvent(
    eventBlock: string,
  ): GoogleCalendarEventDto | undefined {
    let currentIndex = 0;
    const labelValues: (string | null)[] = [];
    for (const fieldLabel of FIELD_LABELS) {
      const result = this.extractField(eventBlock, fieldLabel, currentIndex);
      if (result === null) {
        labelValues.push(null);
      } else {
        labelValues.push(result[0]);
        currentIndex = result[1];
      }
    }
    const startDate = labelValues[0];
    const endDate = labelValues[1];
    if (startDate === null || endDate === null) {
      logger.warn("Invalid calendar event, missing date labels. Skipping...");
      return undefined;
    }
    const googleCalId = labelValues[2];
    if (googleCalId === null) {
      logger.warn(
        "Invalid calendar event, missing label GoogleCalId. Skipping...",
      );
      return undefined;
    }
    const description = labelValues[3];
    const location = labelValues[4];
    const name = labelValues[5];
    if (name === null) {
      logger.warn("Invalid calendar event, missing name. Skipping...");
      return undefined;
    }
    return {
      googleCalId,
      startTime: this.extractDateTime(startDate),
      endTime: this.extractDateTime(endDate),
      name,
      location,
      description,
    };
  }

  private static extractDateTime(dateValue: string): DateTime {
    if (dateValue.includes("VALUE=DATE:")) {
      dateValue = dateValue.substring(11);
    }
    return DateTime.fromISO(dateValue);
  }

  private static extractField(
    eventBlock: string,
    fieldName: string,
    startFrom: number,
  ): [string, number] | null {
    const fieldIndex = eventBlock.indexOf(fieldName, startFrom);
    if (fieldIndex === -1) {
      return null;
    }
    const startIndex = fieldIndex + fieldName.length + 1;
    const endIndex = eventBlock.indexOf("\n", startIndex);
    if (endIndex === -1) {
      return [eventBlock.substring(startIndex).trim(), eventBlock.length];
    }
    return [eventBlock.substring(startIndex, endIndex).trim(), endIndex + 1];
  }
}

const EVENT_FETCH_INTERVAL_S = 3600;

export default class EventCalendarService {
  private static timerHandle?: NodeJS.Timeout;

  public static async startUpdatingEvents(): Promise<boolean> {
    if (this.timerHandle !== undefined) {
      return false;
    }
    await EventCalendarService.updateEvents();
    this.timerHandle = setInterval(async () => {
      await EventCalendarService.updateEvents();
    }, EVENT_FETCH_INTERVAL_S * 1000);
    logger.info("Started event calendar updater...");
    return true;
  }

  private static async updateEvents(): Promise<void> {
    try {
      logger.info("Updating event calendar.");
      await EventCalendarService.removeOutdatedEvents();
      await EventCalendarService.upsertDatabaseEvents();
      logger.info(
        `Event calendar updated. Next update in ${EVENT_FETCH_INTERVAL_S} seconds.`,
      );
    } catch (error) {
      logger.error(error);
    }
  }

  public static stopUpdatingEvents(): boolean {
    if (this.timerHandle === undefined) {
      return false;
    }
    clearInterval(this.timerHandle);
    logger.info("Stopped event calendar updater.");
    this.timerHandle = undefined;
    return true;
  }

  private static async fetchGoogleEvents(): Promise<string> {
    const calendarResponse = await fetch(
      `https://calendar.google.com/calendar/ical/${CALENDAR_ID}/public/basic.ics`,
    );
    if (!calendarResponse.ok) {
      throw new Error(
        `Failed to fetch calendar events - got response status code ${calendarResponse.status}`,
      );
    }
    return calendarResponse.text();
  }

  private static async getEventsInTimeframe(): Promise<
    GoogleCalendarEventDto[]
  > {
    const calendarString = await EventCalendarService.fetchGoogleEvents();
    const parser: CalendarParser = new CalendarParser(calendarString);
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    const events: GoogleCalendarEventDto[] = [];
    let event = parser.getLastEvent();
    while (event !== null && event.startTime >= bound) {
      events.push(event);
      event = parser.getLastEvent();
    }
    return events;
  }

  private static async upsertDatabaseEvents() {
    const newEvents = await EventCalendarService.getEventsInTimeframe();
    for (const event of newEvents) {
      const existingEvent = await CalendarEvent.findBy(
        "google_cal_id",
        event.googleCalId,
      );
      if (existingEvent !== null) {
        existingEvent.startTime = event.startTime;
        existingEvent.endTime = event.endTime;
        existingEvent.name = event.name;
        existingEvent.location = event.location;
        existingEvent.description = event.description;
        await existingEvent.save();
      } else {
        await CalendarEvent.create({ ...event });
      }
    }
  }

  private static async removeOutdatedEvents() {
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    await CalendarEvent.query()
      .where("start_time", "<", bound.toISO())
      .whereNotNull("google_cal_id")
      .delete();
  }

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
