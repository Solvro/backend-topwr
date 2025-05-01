import { RelationType } from "@adminjs/relations";

import { weekdayEnumValues } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

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
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(DaySwap),
              joinKey: DaySwap.getAcademicCalendarRelationKey(),
            },
          },
        },
        {
          displayLabel: "Holidays",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: "holidays",
              joinKey: Holiday.getAcademicCalendarRelationKey(),
            },
          },
        },
      ],
    },
    {
      forModel: DaySwap,
      additionalProperties: { changedWeekday: weekdayEnumValues },
      isRelationTarget: true,
    },
    { forModel: Holiday, isRelationTarget: true },
  ],
  navigation,
};
