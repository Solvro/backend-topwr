import { DateTime } from "luxon";

import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Contributor from "./contributor.js";

@typedModel({
  id: "number",
  name: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Role extends BaseModel {
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
    pivotColumns: ["milestone_id"],
    pivotTimestamps: true,
  })
  declare contributors: ManyToMany<typeof Contributor>;

  static preloadRelations = preloadRelations(Role);
  static handleSearchQuery = handleSearchQuery(Role);
  static handleSortQuery = handleSortQuery(Role);
}
