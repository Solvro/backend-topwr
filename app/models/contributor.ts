import { DateTime } from "luxon";

import { BaseModel, column, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type { HasMany, ManyToMany } from "@adonisjs/lucid/types/relations";

import ContributorSocialLink from "./contributor_social_link.js";
import Milestone from "./milestone.js";
import Role from "./role.js";

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

  @hasMany(() => ContributorSocialLink)
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
}
