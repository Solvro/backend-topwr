import { LucidResource } from "@adminjs/adonis";

import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "Academic Calendars",
  icon: "Calendar",
};

const academicCalendarResource = {
  resource: new LucidResource(AcademicCalendar, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const daySwapResource = {
  resource: new LucidResource(DaySwap, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const holidayResource = {
  resource: new LucidResource(Holiday, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const academicCalendarsResources = [
  academicCalendarResource,
  daySwapResource,
  holidayResource,
];
