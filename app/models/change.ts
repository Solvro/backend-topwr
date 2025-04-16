import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { ChangeType } from "#enums/change_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import ChangeScreenshot from "./change_screenshot.js";
import Version from "./version.js";

export default class Change extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare versionId: number;

  @typedColumn({ type: ChangeType })
  declare type: ChangeType;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "string" })
  declare description: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => ChangeScreenshot)
  declare screenshots: HasMany<typeof ChangeScreenshot>;

  @belongsTo(() => Version)
  declare version: BelongsTo<typeof Version>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
