import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Department from "./department.js";

export default class FieldsOfStudy extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare departmentId: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "string", optional: true })
  declare url: string | null;

  @typedColumn({
    type: "integer",
    validator: vine.number().withoutDecimals().positive(),
  })
  declare semesterCount: number;

  @typedColumn({ type: "boolean" })
  declare isEnglish: boolean;

  @typedColumn({
    type: "boolean",
    columnName: "is_2nd_degree",
    serializeAs: "is2ndDegree",
  })
  declare is2ndDegree: boolean;

  @typedColumn({ type: "boolean" })
  declare hasWeekendOption: boolean;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  public static getDepartmentRelationKey() {
    return "departmentId";
  }

  static preloadRelations = preloadRelations(FieldsOfStudy);

  static handleSearchQuery = handleSearchQuery(FieldsOfStudy);

  static handleSortQuery = handleSortQuery(FieldsOfStudy);
}
