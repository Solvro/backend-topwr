import { DateTime } from "luxon";

import { BaseModel, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import DaySwap from "./day_swap.js";
import Holiday from "./holiday.js";

export default class AcademicCalendar extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare semesterStartDate: DateTime;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare examSessionStartDate: DateTime;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare examSessionLastDate: DateTime;

  @typedColumn({ type: "boolean" })
  declare isFirstWeekEven: boolean;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => DaySwap)
  declare daySwaps: HasMany<typeof DaySwap>;

  @hasMany(() => Holiday)
  declare holidays: HasMany<typeof Holiday>;

  static preloadRelations = preloadRelations(AcademicCalendar);
  static handleSearchQuery = handleSearchQuery(AcademicCalendar);
  static handleSortQuery = handleSortQuery(AcademicCalendar);
}
