import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import {
  academicCalendarValidator,
  daySwapValidator,
  holidayValidator,
} from "./validators/academic_calendars.js";
import { validateResource } from "./validators/utils.js";

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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(academicCalendarValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(academicCalendarValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(daySwapValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(daySwapValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(holidayValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(holidayValidator, request),
      },
    },
  },
};

export const academicCalendarsResources = [
  academicCalendarResource,
  daySwapResource,
  holidayResource,
];
