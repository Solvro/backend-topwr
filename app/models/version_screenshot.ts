import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";
import Version from "./version.js";

export default class VersionScreenshot extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ foreignKeyOf: () => Version })
  declare versionId: number;

  @typedColumn({ foreignKeyOf: () => FileEntry })
  declare imageKey: string;

  @typedColumn({ type: "string", optional: true })
  declare subtitle: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Version)
  declare version: BelongsTo<typeof Version>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
