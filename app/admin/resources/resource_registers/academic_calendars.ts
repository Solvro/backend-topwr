import { weekdayEnumValues } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Academic Calendars",
  icon: "Calendar",
};

export const AcademicCalendarsBuilder: ResourceBuilder = {
  builders: [
    { forModel: AcademicCalendar },
    {
      forModel: DaySwap,
      additionalProperties: { changedWeekday: weekdayEnumValues },
    },
    { forModel: Holiday },
  ],
  navigation,
};
