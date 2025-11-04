import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";

export default class AboutUsGeneral extends BaseModel {
  public static table = "about_us_general";

  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare description: string;

  @typedColumn({ foreignKeyOf: () => FileEntry })
  declare coverPhotoKey: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "coverPhotoKey",
  })
  declare coverPhoto: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
