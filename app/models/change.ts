import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { ChangeType } from "#enums/change_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import ChangeScreenshot from "./change_screenshot.js";
import Version from "./version.js";

@typedModel({
  id: "number",
  name: "string",
  type: "string",
  description: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Change extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare type: ChangeType;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => ChangeScreenshot)
  declare screenshots: HasMany<typeof ChangeScreenshot>;

  @belongsTo(() => Version)
  declare version: BelongsTo<typeof Version>;

  static preloadRelations = preloadRelations(Change);
  static handleSearchQuery = handleSearchQuery(Change);
  static handleSortQuery = handleSortQuery(Change);
}
