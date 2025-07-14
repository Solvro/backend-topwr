import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { StudiesType } from "#enums/studies_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Department from "./department.js";

export default class FieldsOfStudy extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ foreignKeyOf: () => Department })
  declare departmentId: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "string", optional: true })
  declare url: string | null;

  @typedColumn({ type: "boolean" })
  declare isEnglish: boolean;

  @typedColumn({
    type: StudiesType,
  })
  declare studiesType: StudiesType;

  @typedColumn({ type: "boolean" })
  declare hasWeekendOption: boolean;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
