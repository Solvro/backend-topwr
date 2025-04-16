import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { applyLinkTypeSorting } from "#enums/link_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import DepartmentLink from "./department_link.js";
import FieldOfStudy from "./field_of_study.js";
import FileEntry from "./file_entry.js";

export default class Department extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "string", columnName: "address_line1" })
  declare addressLine1: string;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ type: "string" })
  declare code: string;

  @typedColumn({ type: "string" })
  declare betterCode: string;

  @typedColumn({ type: "uuid", optional: true })
  declare logoKey: string | null;

  @typedColumn({ type: "string", optional: true })
  declare description: string | null;

  @typedColumn({ type: "string" })
  declare gradientStart: string;

  @typedColumn({ type: "string" })
  declare gradientStop: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => FieldOfStudy)
  declare fieldsOfStudy: HasMany<typeof FieldOfStudy>;

  @hasMany(() => DepartmentLink, {
    onQuery: (query) => {
      return query.orderByRaw(applyLinkTypeSorting);
    },
  })
  declare departmentLinks: HasMany<typeof DepartmentLink>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "logoKey",
  })
  declare logo: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
