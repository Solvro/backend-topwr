import { DateTime } from "luxon";

import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { Weekday } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";

export default class extends BaseSeeder {
  static environment = ["development", "testing"];

  async run() {
    const calendars = await AcademicCalendar.createMany([
      {
        name: "Cal1",
        semesterStartDate: DateTime.local(2023, 10, 1),
        examSessionStartDate: DateTime.local(2024, 2, 1),
        examSessionLastDate: DateTime.local(2024, 2, 14),
        isFirstWeekEven: true,
      },
      {
        name: "Cal2",
        semesterStartDate: DateTime.local(2024, 2, 26),
        examSessionStartDate: DateTime.local(2024, 6, 18),
        examSessionLastDate: DateTime.local(2024, 7, 5),
        isFirstWeekEven: false,
      },
      {
        name: "Cal3",
        semesterStartDate: DateTime.local(2021, 10, 3),
        examSessionStartDate: DateTime.local(2022, 2, 3),
        examSessionLastDate: DateTime.local(2022, 2, 17),
        isFirstWeekEven: false,
      },
      {
        name: "Cal4",
        semesterStartDate: DateTime.local(2022, 3, 2),
        examSessionStartDate: DateTime.local(2022, 6, 26),
        examSessionLastDate: DateTime.local(2022, 7, 14),
        isFirstWeekEven: true,
      },
    ]);

    const dates = [
      [
        {
          start: DateTime.local(2023, 11, 11),
          last: DateTime.local(2023, 11, 11),
        },
        {
          start: DateTime.local(2023, 11, 15),
          last: DateTime.local(2023, 11, 15),
        },
        {
          start: DateTime.local(2023, 12, 20),
          last: DateTime.local(2024, 1, 8),
        },
      ],
      [
        {
          start: DateTime.local(2024, 4, 11),
          last: DateTime.local(2024, 4, 16),
        },
        {
          start: DateTime.local(2024, 4, 30),
          last: DateTime.local(2024, 5, 6),
        },
        {
          start: DateTime.local(2024, 6, 14),
          last: DateTime.local(2024, 6, 17),
        },
      ],
      [
        {
          start: DateTime.local(2021, 11, 11),
          last: DateTime.local(2021, 11, 11),
        },
        {
          start: DateTime.local(2021, 11, 15),
          last: DateTime.local(2021, 11, 15),
        },
        {
          start: DateTime.local(2021, 12, 18),
          last: DateTime.local(2022, 1, 6),
        },
      ],
      [
        {
          start: DateTime.local(2022, 3, 30),
          last: DateTime.local(2022, 4, 6),
        },
        {
          start: DateTime.local(2022, 4, 29),
          last: DateTime.local(2022, 5, 5),
        },
        {
          start: DateTime.local(2022, 6, 7),
          last: DateTime.local(2022, 6, 11),
        },
      ],
    ];

    const dateWithChangedWeekday = [
      [
        { date: DateTime.local(2023, 11, 19), changedWeekday: Weekday.Friday },
        {
          date: DateTime.local(2023, 12, 18),
          changedWeekday: Weekday.Thursday,
        },
        { date: DateTime.local(2024, 1, 21), changedWeekday: Weekday.Monday },
        { date: DateTime.local(2024, 1, 29), changedWeekday: Weekday.Friday },
      ],
      [
        { date: DateTime.local(2024, 3, 22), changedWeekday: Weekday.Thursday },
        { date: DateTime.local(2024, 4, 12), changedWeekday: Weekday.Tuesday },
        { date: DateTime.local(2024, 5, 18), changedWeekday: Weekday.Thursday },
        { date: DateTime.local(2024, 6, 6), changedWeekday: Weekday.Monday },
      ],
      [
        { date: DateTime.local(2021, 11, 21), changedWeekday: Weekday.Friday },
        { date: DateTime.local(2022, 1, 11), changedWeekday: Weekday.Tuesday },
        {
          date: DateTime.local(2022, 1, 17),
          changedWeekday: Weekday.Wednesday,
        },
        { date: DateTime.local(2022, 1, 22), changedWeekday: Weekday.Tuesday },
      ],
      [
        { date: DateTime.local(2022, 4, 3), changedWeekday: Weekday.Monday },
        {
          date: DateTime.local(2022, 4, 28),
          changedWeekday: Weekday.Wednesday,
        },
        { date: DateTime.local(2022, 5, 23), changedWeekday: Weekday.Friday },
        {
          date: DateTime.local(2022, 6, 13),
          changedWeekday: Weekday.Wednesday,
        },
      ],
    ];

    for (const [i, calendar] of calendars.entries()) {
      await calendar.related("holidays").createMany([
        {
          startDate: dates[i][0].start,
          lastDate: dates[i][0].last,
          description: `Description for holiday 1 in calendar ${i + 1}`,
        },
        {
          startDate: dates[i][1].start,
          lastDate: dates[i][1].last,
          description: `Description for holiday 2 in calendar ${i + 1}`,
        },
        {
          startDate: dates[i][2].start,
          lastDate: dates[i][2].last,
          description: `Description for holiday 3 in calendar ${i + 1}`,
        },
      ]);

      await calendar.related("daySwaps").createMany([
        {
          date: dateWithChangedWeekday[i][0].date,
          changedWeekday: dateWithChangedWeekday[i][0].changedWeekday,
          changedDayIsEven: true,
        },
        {
          date: dateWithChangedWeekday[i][1].date,
          changedWeekday: dateWithChangedWeekday[i][1].changedWeekday,
          changedDayIsEven: false,
        },
        {
          date: dateWithChangedWeekday[i][2].date,
          changedWeekday: dateWithChangedWeekday[i][2].changedWeekday,
          changedDayIsEven: false,
        },
        {
          date: dateWithChangedWeekday[i][3].date,
          changedWeekday: dateWithChangedWeekday[i][3].changedWeekday,
          changedDayIsEven: true,
        },
      ]);
    }
  }
}
