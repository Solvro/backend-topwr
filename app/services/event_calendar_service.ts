import { DateTime } from "luxon";

import logger from "@adonisjs/core/services/logger";

import CalendarEvent from "#models/calendar_event";

const FETCH_LIMIT_DAYS = 30;
const CALENDAR_ID = "9ke30hbjjke60u5jbii42g2rpo@group.calendar.google.com";
const FIELD_LABELS = [
  "UID",
  "DTSTART",
  "DTEND",
  "SUMMARY",
  "LOCATION",
  "DESCRIPTION",
];

interface CalendarEventDto {
  googleCalId: string;
  startTime: DateTime;
  endTime: DateTime;
  name: string;
  location: string | null;
  description: string | null;
}

class CalendarParser {
  private cursor: number;

  constructor(private calendarString: string) {
    if (this.calendarString.length < 14) {
      throw new Error("Calendar invalid");
    }
    this.cursor = calendarString.length - 14;
  }

  public getLastEvent(): CalendarEventDto | null {
    let event = this.extractLastEvent();
    while (event === undefined) {
      event = this.extractLastEvent();
    }
    return event;
  }

  //null - none left, undefined - malformed event
  private extractLastEvent(): CalendarEventDto | null | undefined {
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

  private static parseEvent(eventBlock: string): CalendarEventDto | undefined {
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
    const googleCalId = labelValues[0];
    if (googleCalId === null) {
      logger.warn(
        "Invalid calendar event, missing label GoogleCalId. Skipping...",
      );
      return undefined;
    }
    const startDate = labelValues[1];
    const endDate = labelValues[2];
    if (startDate === null || endDate === null) {
      logger.warn("Invalid calendar event, missing date labels. Skipping...");
      return undefined;
    }
    const name = labelValues[3];
    if (name === null) {
      logger.warn("Invalid calendar event, missing name. Skipping...");
      return undefined;
    }
    const location = labelValues[4];
    const description = labelValues[5];
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

  constructor() {
    void EventCalendarService.startUpdatingEvents();
  }

  private static async startUpdatingEvents(): Promise<boolean> {
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
      await EventCalendarService.removeOutdatedEvents();
      await EventCalendarService.upsertDatabaseEvents();
    } catch (error) {
      logger.error(error);
    }
  }

  // @ts-expect-error unused method
  private static stopUpdatingEvents(): boolean {
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

  private static async getEventsInTimeframe(): Promise<CalendarEventDto[]> {
    const calendarString = await EventCalendarService.fetchGoogleEvents();
    const parser: CalendarParser = new CalendarParser(calendarString);
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    const events: CalendarEventDto[] = [];
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
      .delete();
  }
}
