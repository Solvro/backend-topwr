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
  static name = "Academic calendar scraper";
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
    const semesterStartDate = DateTime.fromISO(
      academicCalendarResult.data.semesterStartDate,
    );
    const examSessionStartDate = DateTime.fromISO(
      academicCalendarResult.data.examSessionStartDate,
    );
    const examSessionLastDate = DateTime.fromISO(
      academicCalendarResult.data.examSessionLastDay,
    );

    const academicCalendar = await AcademicCalendar.create({
      name:
        semesterStartDate.year === examSessionLastDate.year
          ? `${examSessionLastDate.year - 1}/${examSessionLastDate.year} Lato`
          : `${semesterStartDate.year}/${examSessionLastDate.year} Zima`,
      semesterStartDate,
      examSessionStartDate,
      examSessionLastDate,
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

    const validDaySwaps = daySwapsResult.data.filter((daySwap) => {
      if (daySwap.changedWeekday in weekdayMap) {
        return true;
      }
      this.logger.warning(
        `Day swap for ${daySwap.day} skipped due to an invalid weekday (${daySwap.changedWeekday})`,
      );
      return false;
    });

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
