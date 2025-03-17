import { DateTime } from "luxon";

import { BaseScraperModule } from "#commands/db_scrape";
import { Weekday } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";

interface AcademicCalendarData {
  data: {
    id: number;
    user_updated: string;
    date_updated: string;
    semesterStartDate: string;
    examSessionStartDate: string;
    isFirstWeekEven: boolean;
    examSessionLastDay: string;
  };
}

interface WeekExceptions {
  data: {
    id: number;
    day: string;
    changedWeekday: string;
    changedDayIsEven: boolean;
  }[];
}

export default class AcademicCalendarScraper extends BaseScraperModule {
  static name = "academic calendar scraper";
  static description = "Import data about academic calendars and day swaps";
  static taskTitle = "Fetching academic calendar and day swaps data";

  async run(): Promise<void> {
    const [academicCalendarResponse, daySwapsResponse] = await Promise.all([
      fetch("https://admin.topwr.solvro.pl/items/AcademicCalendarData"),
      fetch("https://admin.topwr.solvro.pl/items/WeekExceptions"),
    ]);

    if (!academicCalendarResponse.ok) {
      throw new Error(
        `Fetching academic calendar has failed. Status code: ${academicCalendarResponse.status}`,
      );
    }
    if (!daySwapsResponse.ok) {
      throw new Error(
        `Fetching day swaps has failed. Status code: ${daySwapsResponse.status}`,
      );
    }

    const [academicCalendarResult, daySwapsResult] = await Promise.all([
      academicCalendarResponse.json() as Promise<AcademicCalendarData>,
      daySwapsResponse.json() as Promise<WeekExceptions>,
    ]);

    const academicCalendar = await AcademicCalendar.create({
      name: "2024/2025 Lato",
      semesterStartDate: DateTime.fromISO(
        academicCalendarResult.data.semesterStartDate,
      ),
      examSessionStartDate: DateTime.fromISO(
        academicCalendarResult.data.examSessionStartDate,
      ),
      examSessionLastDate: DateTime.fromISO(
        academicCalendarResult.data.examSessionLastDay,
      ),
      isFirstWeekEven: academicCalendarResult.data.isFirstWeekEven,
      createdAt: DateTime.fromISO(academicCalendarResult.data.date_updated),
      updatedAt: DateTime.fromISO(academicCalendarResult.data.date_updated),
    });

    const weekdayMap = {
      Mon: Weekday.Monday,
      Tue: Weekday.Tuesday,
      Wed: Weekday.Wednesday,
      Thu: Weekday.Thursday,
      Fri: Weekday.Friday,
      Sat: Weekday.Saturday,
      Sun: Weekday.Sunday,
    };

    const validDaySwaps = daySwapsResult.data.filter(
      (daySwap) =>
        weekdayMap[daySwap.changedWeekday as keyof typeof weekdayMap] !==
        undefined,
    );

    await Promise.all(
      validDaySwaps.map((daySwap) =>
        academicCalendar.related("daySwaps").create({
          date: DateTime.fromISO(daySwap.day),
          changedWeekday:
            weekdayMap[daySwap.changedWeekday as keyof typeof weekdayMap],
          changedDayIsEven: daySwap.changedDayIsEven,
        }),
      ),
    );
  }
}
