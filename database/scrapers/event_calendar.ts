import { DateTime } from "luxon";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import CalendarEvent from "#models/calendar_event";
import { ICSObject, ICSRoot, ICSValue, parseICS } from "#utils/ics";

const FETCH_LIMIT_DAYS = 30;
const CALENDAR_ID = "9ke30hbjjke60u5jbii42g2rpo@group.calendar.google.com";
const FIELD_LABELS = {
  startDate: "DTSTART",
  endDate: "DTEND",
  googleCalId: "UID",
  desc: "DESCRIPTION",
  location: "LOCATION",
  name: "SUMMARY",
};

interface GoogleCalendarEventDto {
  googleCalId: string;
  startTime: DateTime<true>;
  endTime: DateTime<true>;
  name: string;
  location: string | null;
  description: string | null;
}

class CalendarParser {
  private events: ICSObject[];

  constructor(
    private calendarString: string,
    // In case no logging is needed
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private logger: (message: string) => void = (_) => {},
  ) {
    if (
      !this.calendarString.startsWith("BEGIN:VCALENDAR") ||
      !this.calendarString.trimEnd().endsWith("END:VCALENDAR")
    ) {
      throw new Error("Calendar invalid");
    }
    const calendarRoot = parseICS(calendarString, this.logger).VCALENDAR;
    if (calendarRoot === undefined) {
      throw new Error("Calendar invalid - missing calendar root");
    }
    const eventArray = (calendarRoot as ICSRoot).VEVENT;
    if (eventArray === undefined || !Array.isArray(eventArray)) {
      throw new Error("Calendar invalid - missing event array");
    }
    this.events = eventArray;
  }

  public *getLastEvent(): Generator<GoogleCalendarEventDto, void, undefined> {
    const validEvents = this.events
      .map((e, index) => this.parseEvent(e, index))
      .filter((e) => e !== undefined)
      .sort((a, b) => {
        const diff = a.endTime.diff(b.endTime).milliseconds;
        if (diff !== 0) {
          return diff;
        }
        return a.startTime.diff(b.startTime).milliseconds;
      }); //sorted from earliest to last, with one most recent/in the future being last
    for (let i = validEvents.length - 1; i >= 0; i--) {
      yield validEvents[i];
    }
  }

  private static asValidDateTime(
    dateValue: ICSValue | undefined,
  ): DateTime<true> | null {
    if (dateValue === undefined || Array.isArray(dateValue)) {
      return null;
    }
    if (typeof dateValue === "string") {
      //timestamp: dateValue = 20180424T00:13:21
      const dateTime = DateTime.fromISO(dateValue);
      if (dateTime.isValid) {
        return dateTime;
      }
      return null;
    }
    const nestedDateValue = dateValue.VALUE; //full day date:  dateValue = { "VALUE": "DATE:20180421" }
    if (
      nestedDateValue !== undefined &&
      typeof nestedDateValue === "string" &&
      nestedDateValue.length === 13
    ) {
      const dateTime = DateTime.fromISO(nestedDateValue.substring(5));
      if (dateTime.isValid) {
        return dateTime;
      }
      return null;
    }
    const nestedTZIDValue = dateValue.TZID; // 3rd date format: dataValue = { "TZID": "[timezone]:YYYYMMDDTHHMMSS"} (can be parsed as ISO timestamp despite the lack of ':' in time part)
    if (nestedTZIDValue !== undefined && typeof nestedTZIDValue === "string") {
      const timeStart = nestedTZIDValue.indexOf(":"); //assuming that timezone is always Europe/Warsaw -  I don't see why the student council would schedule otherwise and other VALUE events are without timezones as well
      if (timeStart === -1) {
        return null;
      }
      const dateTime = DateTime.fromISO(
        nestedTZIDValue.substring(timeStart + 1),
      );
      if (dateTime.isValid) {
        return dateTime;
      }
      return null;
    }
    return null;
  }

  private static asString(value: ICSValue | undefined): string | null {
    if (value === undefined || typeof value !== "string") {
      return null;
    }
    return value;
  }

  private parseEvent(
    eventBlock: ICSRoot,
    eventNumber: number,
  ): GoogleCalendarEventDto | undefined {
    const startTime = CalendarParser.asValidDateTime(
      eventBlock[FIELD_LABELS.startDate],
    );
    const endTime = CalendarParser.asValidDateTime(
      eventBlock[FIELD_LABELS.endDate],
    );
    if (startTime === null || endTime === null) {
      this.logger(
        `Invalid calendar event ${eventNumber}, missing date labels. Skipping...`,
      );
      return undefined;
    }
    const googleCalId = CalendarParser.asString(
      eventBlock[FIELD_LABELS.googleCalId],
    );
    if (googleCalId === null) {
      this.logger(
        `Invalid calendar event ${eventNumber}, missing googleCalId. Skipping...`,
      );
      return undefined;
    }
    const name = CalendarParser.asString(eventBlock[FIELD_LABELS.name]);
    if (name === null) {
      this.logger(
        `Invalid calendar event ${eventNumber}, missing name. Skipping...`,
      );
      return undefined;
    }
    const description = CalendarParser.asString(eventBlock[FIELD_LABELS.desc]);
    const location = CalendarParser.asString(eventBlock[FIELD_LABELS.location]);
    return {
      googleCalId,
      startTime,
      endTime,
      name,
      location,
      description,
    };
  }
}

export default class EventCalendarUpdater extends BaseScraperModule {
  static name = "Event calendar";
  static description =
    "Update and push to the database events from the Student Council Google calendar as Google events (non-editable, removable)";
  static taskTitle =
    "Update event calendar with latest events from Student Council Google calendar";

  private async fetchGoogleEvents(): Promise<string> {
    const response = await this.fetchAndCheckStatus(
      `https://calendar.google.com/calendar/ical/${CALENDAR_ID}/public/basic.ics`,
      "Event calendar ICS file",
    );
    return response.text();
  }

  private async getEventsInTimeframe(
    task: TaskHandle,
  ): Promise<GoogleCalendarEventDto[]> {
    const calendarString = await this.fetchGoogleEvents();
    const parser: CalendarParser = new CalendarParser(
      calendarString,
      (message) => this.logger.warning(message),
    );
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    const events: GoogleCalendarEventDto[] = [];
    for (const event of parser.getLastEvent()) {
      if (event.startTime < bound && event.endTime < bound) {
        break;
      }
      events.push(event);
    }
    task.update(
      `Total of ${events.length} events found in the given timeframe (${FETCH_LIMIT_DAYS} days).`,
    );
    return events;
  }

  private async upsertDatabaseEvents(task: TaskHandle) {
    const newEvents = await this.getEventsInTimeframe(task);
    let updatedCount = 0;
    let newCount = 0;
    for (const event of newEvents) {
      const existingEvent = await CalendarEvent.findBy(
        "google_cal_id",
        event.googleCalId,
      );
      if (existingEvent !== null) {
        existingEvent.merge(event);
        await existingEvent.save();
        updatedCount++;
        this.logger.info(`Updated event ${event.name}`);
      } else {
        await CalendarEvent.create({ ...event });
        newCount++;
        this.logger.info(`Added new event ${event.name}`);
      }
    }
    task.update(`Added ${newCount} new events, updated ${updatedCount} events`);
  }

  private static async removeOutdatedEvents(task: TaskHandle) {
    const bound = DateTime.now().minus({ days: FETCH_LIMIT_DAYS });
    const deleted = await CalendarEvent.query()
      .where("end_time", "<", bound.toISO())
      .whereNotNull("google_cal_id")
      .delete();
    task.update(`Removed ${deleted.pop()} outdated events`);
  }

  async run(task: TaskHandle): Promise<void> {
    task.update("Updating event calendar.");
    await EventCalendarUpdater.removeOutdatedEvents(task);
    await this.upsertDatabaseEvents(task);
    task.update(`Event calendar updated.`);
  }
}
