import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Building from "./building.js";
import FileEntry from "./file_entry.js";

export default class Campus extends BaseModel {
  @typedColumn({ isPrimary: true, type: "number" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare coverKey: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => Building)
  declare buildings: HasMany<typeof Building>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "coverKey",
  })
  declare cover: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
