import { LucidResource } from "@adminjs/adonis";

import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const academicCalendarResource = {
  resource: new LucidResource(AcademicCalendar, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const daySwapResource = {
  resource: new LucidResource(DaySwap, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const holidayResource = {
  resource: new LucidResource(Holiday, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
