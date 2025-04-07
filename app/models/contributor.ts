import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { applyLinkTypeSorting } from "#enums/link_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import ContributorSocialLink from "./contributor_social_link.js";
import FileEntry from "./file_entry.js";
import Milestone from "./milestone.js";
import Role from "./role.js";

export default class Contributor extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "uuid", optional: true })
  declare photoKey: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
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

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "photoKey",
  })
  declare photo: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations(Contributor);
  static handleSearchQuery = handleSearchQuery(Contributor);
  static handleSortQuery = handleSortQuery(Contributor);

  serializeExtras = true;
}
