import { DateTime } from "luxon";

import { BaseModel, column, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { applyLinkTypeSorting } from "#enums/link_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import ContributorSocialLink from "./contributor_social_link.js";
import Milestone from "./milestone.js";
import Role from "./role.js";

@typedModel({
  id: "number",
  name: "string",
  photoKey: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Contributor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare photoKey: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => ContributorSocialLink, {
    onQuery: (query) => {
      return query.orderByRaw(applyLinkTypeSorting);
    },
  })
  declare socialLinks: HasMany<typeof ContributorSocialLink>;

  @manyToMany(() => Role, {
    pivotTable: "contributor_roles",
    pivotColumns: ["milestone_id"],
    pivotTimestamps: true,
  })
  declare roles: ManyToMany<typeof Role>;

  @manyToMany(() => Milestone, {
    pivotTable: "contributor_roles",
    pivotColumns: ["role_id"],
    pivotTimestamps: true,
  })
  declare milestones: ManyToMany<typeof Milestone>;

  static preloadRelations = preloadRelations(Contributor);
  static handleSearchQuery = handleSearchQuery(Contributor);
  static handleSortQuery = handleSortQuery(Contributor);

  serializeExtras = true;
}
