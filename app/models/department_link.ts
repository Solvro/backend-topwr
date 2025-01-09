import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { LinkType } from "#enums/link_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Department from "./department.js";

export default class DepartmentsLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare departmentId: number;

  @column()
  declare linkType: LinkType;

  @column()
  declare link: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  static preloadRelations = preloadRelations(DepartmentsLink);

  static handleSearchQuery = handleSearchQuery(DepartmentsLink);

  static handleSortQuery = handleSortQuery(DepartmentsLink);
}
