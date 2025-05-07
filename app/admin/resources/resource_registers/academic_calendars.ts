import { RelationType } from "@adminjs/relations";

import { weekdayEnumValues } from "#enums/weekday";
import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";
import {
  anyCaseToPlural_camelCase,
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

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
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(DaySwap),
              joinKey: getOneToManyRelationForeignKey(
                AcademicCalendar,
                anyCaseToPlural_camelCase(DaySwap),
              ),
            },
          },
        },
        {
          displayLabel: "Holidays",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: "holidays",
              joinKey: getOneToManyRelationForeignKey(
                AcademicCalendar,
                "holidays",
              ),
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
