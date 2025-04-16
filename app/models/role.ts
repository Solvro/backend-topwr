import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedColumn, typedManyToMany } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Contributor from "./contributor.js";

export default class Role extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @typedManyToMany(() => Contributor, {
    pivotTable: "contributor_roles",
    pivotColumns: { milestone_id: { type: "integer" } },
    pivotTimestamps: true,
  })
  declare contributors: ManyToMany<typeof Contributor>;

  static preloadRelations = preloadRelations(Role);
  static handleSearchQuery = handleSearchQuery(Role);
  static handleSortQuery = handleSortQuery(Role);

  serializeExtras = true;
}
