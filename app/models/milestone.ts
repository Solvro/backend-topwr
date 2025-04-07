import { DateTime } from "luxon";

import { BaseModel, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Contributor from "./contributor.js";
import Version from "./version.js";

export default class Milestone extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => Contributor, {
    pivotTable: "contributor_roles",
    pivotColumns: ["role_id"],
    pivotTimestamps: true,
  })
  declare contributors: ManyToMany<typeof Contributor>;

  @hasMany(() => Version)
  declare versions: HasMany<typeof Version>;

  static preloadRelations = preloadRelations(Milestone);
  static handleSearchQuery = handleSearchQuery(Milestone);
  static handleSortQuery = handleSortQuery(Milestone);
}
