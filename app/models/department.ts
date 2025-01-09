import { DateTime } from "luxon";

import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";

import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import DepartmentLink from "./department_link.js";
import FieldOfStudy from "./field_of_study.js";

export default class Department extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column({ columnName: "address_line1" })
  declare addressLine1: string;

  @column({ columnName: "address_line2" })
  declare addressLine2: string | null;

  @column()
  declare code: string;

  @column()
  declare betterCode: string;

  @column()
  declare logo: string | null;

  @column()
  declare description: string | null;

  @column()
  declare gradientStart: string;

  @column()
  declare gradientStop: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => FieldOfStudy)
  declare fieldOfStudy: HasMany<typeof FieldOfStudy>;

  @hasMany(() => DepartmentLink)
  declare departmentLink: HasMany<typeof DepartmentLink>;

  static includeRelations = preloadRelations(Department);

  static handleSearchQuery = handleSearchQuery(Department);

  static handleSortQuery = handleSortQuery(Department);
}
