import vine from "@vinejs/vine";

import { Weekday } from "#enums/weekday";

export const academicCalendarValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).trim(),
    semesterStartDate: vine.date(),
    examSessionStartDate: vine.date(),
    examSessionLastDate: vine.date(),
    isFirstWeekEven: vine.boolean(),
  }),
);

export const daySwapValidator = vine.compile(
  vine.object({
    academicCalendarId: vine.number().min(0).withoutDecimals(),
    date: vine.date(),
    changedWeekday: vine.enum(Weekday),
    changedDayIsEven: vine.boolean(),
  }),
);

export const holidayValidator = vine.compile(
  vine.object({
    academicCalendarId: vine.number().min(0).withoutDecimals(),
    startDate: vine.date(),
    lastDate: vine.date(),
    description: vine.string().minLength(1).trim(),
  }),
);
