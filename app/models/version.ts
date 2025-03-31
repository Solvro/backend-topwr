import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Change from "./change.js";
import Milestone from "./milestone.js";
import VersionScreenshot from "./version_screenshot.js";

@typedModel({
  id: "number",
  milestoneId: "number",
  name: "string",
  releaseDate: "DateTime",
  description: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Version extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare milestoneId: number;

  @column()
  declare name: string;

  @column.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare releaseDate: DateTime | null;

  @column()
  declare description: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
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
