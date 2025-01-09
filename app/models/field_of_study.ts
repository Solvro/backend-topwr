import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Department from "./department.js";

export default class FieldsOfStudy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare departmentId: number;

  @column()
  declare name: string;

  @column()
  declare url: string | null;

  @column()
  declare semesterCount: number;

  @column()
  declare isEnglish: boolean;

  @column({ columnName: "is_2nd_degree" })
  declare is2ndDegree: boolean;

  @column()
  declare hasWeekendOption: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  static preloadRelations = preloadRelations(FieldsOfStudy);

  static handleSearchQuery = handleSearchQuery(FieldsOfStudy);

  static handleSortQuery = handleSortQuery(FieldsOfStudy);
}
