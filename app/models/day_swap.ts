import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { Weekday } from "#enums/weekday";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import AcademicCalendar from "./academic_calendar.js";

export default class DaySwap extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare academicCalendarId: number;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare date: DateTime;

  @typedColumn({ type: Weekday })
  declare changedWeekday: Weekday;

  @typedColumn({ type: "boolean" })
  declare changedDayIsEven: boolean;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => AcademicCalendar)
  declare academicCalendar: BelongsTo<typeof AcademicCalendar>;

  static preloadRelations = preloadRelations(DaySwap);
  static handleSearchQuery = handleSearchQuery(DaySwap);
  static handleSortQuery = handleSortQuery(DaySwap);
}
