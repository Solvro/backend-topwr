import { DateTime } from "luxon";

import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import DaySwap from "./day_swap.js";
import Holiday from "./holiday.js";

@typedModel({
  id: "number",
  name: "string",
  semesterStartDate: "DateTime",
  examSessionStartDate: "DateTime",
  examSessionLastDate: "DateTime",
  isFirstWeekEven: "boolean",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class AcademicCalendar extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column.date()
  declare semesterStartDate: DateTime;

  @column.date()
  declare examSessionStartDate: DateTime;

  @column.date()
  declare examSessionLastDate: DateTime;

  @column()
  declare isFirstWeekEven: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => DaySwap)
  declare daySwaps: HasMany<typeof DaySwap>;

  @hasMany(() => Holiday)
  declare holidays: HasMany<typeof Holiday>;

  static preloadRelations = preloadRelations(AcademicCalendar);
  static handleSearchQuery = handleSearchQuery(AcademicCalendar);
  static handleSortQuery = handleSortQuery(AcademicCalendar);
}
