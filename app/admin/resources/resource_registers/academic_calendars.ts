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
    {
      forModel: AcademicCalendar,
      ownedRelations: [
        {
          displayLabel: "Day swaps",
          relationDefinition: {
            targetModel: DaySwap,
          },
        },
        {
          displayLabel: "Holidays",
          relationDefinition: {
            targetModel: Holiday,
            targetModelPlural_camelCase: "holidays",
            targetModelPlural_snake_case: "holidays",
          },
        },
      ],
    },
    {
      forModel: DaySwap,
      additionalProperties: { changedWeekday: weekdayEnumValues },
      targetedByModels: [
        {
          ownerModel: AcademicCalendar,
        },
      ],
    },
    {
      forModel: Holiday,
      targetedByModels: [
        {
          ownerModel: AcademicCalendar,
        },
      ],
    },
  ],
  navigation,
};
