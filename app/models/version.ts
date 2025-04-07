import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Change from "./change.js";
import Milestone from "./milestone.js";
import VersionScreenshot from "./version_screenshot.js";

export default class Version extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare milestoneId: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare releaseDate: DateTime | null;

  @typedColumn({ type: "string", optional: true })
  declare description: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => VersionScreenshot)
  declare screenshots: HasMany<typeof VersionScreenshot>;

  @hasMany(() => Change)
  declare changes: HasMany<typeof Change>;

  @belongsTo(() => Milestone)
  declare milestone: BelongsTo<typeof Milestone>;

  static preloadRelations = preloadRelations(Version);
  static handleSearchQuery = handleSearchQuery(Version);
  static handleSortQuery = handleSortQuery(Version);
}
