import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Building from "./building.js";
import FileEntry from "./file_entry.js";

export default class Aed extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "number", validator: vine.number().min(-90).max(90) })
  declare latitude: number;

  @typedColumn({ type: "number", validator: vine.number().min(-180).max(180) })
  declare longitude: number;

  @typedColumn({ type: "string", optional: true, columnName: "address_line1" })
  declare addressLine1: string | null;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare photoKey: string | null;

  @typedColumn({
    foreignKeyOf: () => Building,
    optional: true,
  })
  declare buildingId: number | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "photoKey",
  })
  declare photo: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
