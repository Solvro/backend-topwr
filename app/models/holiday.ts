import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import AcademicCalendar from "./academic_calendar.js";

@typedModel({
  id: "number",
  academicCalendarId: "number",
  startDate: "DateTime",
  lastDate: "DateTime",
  description: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Holiday extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare academicCalendarId: number;

  @column.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare startDate: DateTime;

  @column.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare lastDate: DateTime;

  @column()
  declare description: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => AcademicCalendar)
  declare academicCalendar: BelongsTo<typeof AcademicCalendar>;

  static preloadRelations = preloadRelations(Holiday);
  static handleSearchQuery = handleSearchQuery(Holiday);
  static handleSortQuery = handleSortQuery(Holiday);
}
