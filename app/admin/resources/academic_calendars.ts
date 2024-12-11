import { LucidResource } from "@adminjs/adonis";

import AcademicCalendar from "#models/academic_calendar";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const academicCalendarResource = {
  resource: new LucidResource(AcademicCalendar, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
