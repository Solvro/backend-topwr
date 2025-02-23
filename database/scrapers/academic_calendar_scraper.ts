import { DateTime } from "luxon";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { Weekday } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";

interface AcademicCalendarData {
  data: {
    id: number;
    user_updated: string;
    date_updated: DateTime;
    semesterStartDate: DateTime;
    examSessionStartDate: DateTime;
    isFirstWeekEven: boolean;
    examSessionLastDay: DateTime;
  };
}

interface WeekExceptions {
  data: {
    id: number;
    day: DateTime;
    changedWeekday: string;
    changedDayIsEven: boolean;
  }[];
}

export default class AcademicCalendarScraper extends BaseScraperModule {
  static name = "academic calendar scraper";
  static description = "Import data about academic calendars and day swaps";

  async run(task: TaskHandle): Promise<void> {
    task.update("Fetching academic calendar and day swaps data");

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
      name: "",
      semesterStartDate: academicCalendarResult.data.semesterStartDate,
      examSessionStartDate: academicCalendarResult.data.examSessionStartDate,
      examSessionLastDate: academicCalendarResult.data.examSessionLastDay,
      isFirstWeekEven: academicCalendarResult.data.isFirstWeekEven,
      createdAt: academicCalendarResult.data.date_updated,
      updatedAt: academicCalendarResult.data.date_updated,
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

    for (const daySwap of daySwapsResult.data) {
      await academicCalendar.related("daySwaps").create({
        date: daySwap.day,
        changedWeekday:
          weekdayMap[daySwap.changedWeekday as keyof typeof weekdayMap],
        changedDayIsEven: daySwap.changedDayIsEven,
      });
    }

    task.update(
      "The academic calendar and day swaps data have been successfully migrated to the database",
    );
  }
}
