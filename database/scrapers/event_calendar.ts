import { DateTime } from "luxon";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
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

  public getLastEvent(task: TaskHandle): GoogleCalendarEventDto | null {
    let event = this.extractLastEvent(task);
    while (event === undefined) {
      event = this.extractLastEvent(task);
    }
    return event;
  }

  //null - none left, undefined - malformed event
  private extractLastEvent(
    task: TaskHandle,
  ): GoogleCalendarEventDto | null | undefined {
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
    return CalendarParser.parseEvent(eventBlock, task);
  }

  private static parseEvent(
    eventBlock: string,
    task: TaskHandle,
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
      task.update("Invalid calendar event, missing date labels. Skipping...");
      return undefined;
    }
    const googleCalId = labelValues[2];
    if (googleCalId === null) {
      task.update(
        "Invalid calendar event, missing label GoogleCalId. Skipping...",
      );
      return undefined;
    }
    const description = labelValues[3];
    const location = labelValues[4];
    const name = labelValues[5];
    if (name === null) {
      task.update("Invalid calendar event, missing name. Skipping...");
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

export default class EventCalendarUpdater extends BaseScraperModule {
  static name = "Event calendar";
  static description =
    "Update and push to the database events from the Student Council Google calendar as Google events (non-editable, removable)";
  static taskTitle =
    "Update event calendar with latest events from Student Council Google calendar";

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

  private static async getEventsInTimeframe(
    task: TaskHandle,
  ): Promise<GoogleCalendarEventDto[]> {
    const calendarString = await EventCalendarUpdater.fetchGoogleEvents();
    const parser: CalendarParser = new CalendarParser(calendarString);
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    const events: GoogleCalendarEventDto[] = [];
    let event = parser.getLastEvent(task);
    while (event !== null && event.startTime >= bound) {
      events.push(event);
      event = parser.getLastEvent(task);
    }
    task.update(
      `Total of ${events.length} events found in the given timeframe (${FETCH_LIMIT_DAYS} days).`,
    );
    return events;
  }

  private static async upsertDatabaseEvents(task: TaskHandle) {
    const newEvents = await EventCalendarUpdater.getEventsInTimeframe(task);
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
        task.update(`Updated event ${event.name}`);
      } else {
        await CalendarEvent.create({ ...event });
        task.update(`Added new event ${event.name}`);
      }
    }
  }

  private static async removeOutdatedEvents() {
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    await CalendarEvent.query()
      .where("end_time", "<", bound.toISO())
      .whereNotNull("google_cal_id")
      .delete();
  }

  async run(task: TaskHandle): Promise<void> {
    task.update("Updating event calendar.");
    await EventCalendarUpdater.removeOutdatedEvents();
    await EventCalendarUpdater.upsertDatabaseEvents(task);
    task.update(`Event calendar updated.`);
  }
}
