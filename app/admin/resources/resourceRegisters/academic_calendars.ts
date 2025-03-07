import AcademicCalendar from "#models/academic_calendar";
import DaySwap from "#models/day_swap";
import Holiday from "#models/holiday";

import { ResourceFactory, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Academic Calendars",
  icon: "Calendar",
};

export function setUpAcademicCalendars() {
  const info: ResourceInfo[] = [
    { forModel: AcademicCalendar },
    { forModel: DaySwap },
    { forModel: Holiday },
  ];
  ResourceFactory.registerResource({
    navigation,
    builders: info,
  });
}
