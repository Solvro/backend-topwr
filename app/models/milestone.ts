import { DateTime } from "luxon";

import { BaseModel, column, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Contributor from "./contributor.js";
import Version from "./version.js";

@typedModel({
  id: "number",
  name: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Milestone extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
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
