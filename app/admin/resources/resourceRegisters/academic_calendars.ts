import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Academic Calendars",
  icon: "Calendar",
};

export function setUpAcademicCalendars(): ResourceBuilder {
  const info: ResourceInfo[] = [
    { forModel: AcademicCalendar },
    { forModel: DaySwap },
    { forModel: Holiday },
  ];
  return {
    navigation,
    builders: info,
  };
}
