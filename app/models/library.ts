import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Building from "./building.js";
import FileEntry from "./file_entry.js";
import RegularHour from "./regular_hour.js";
import SpecialHour from "./special_hour.js";

export default class Library extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare title: string;

  @typedColumn({ type: "string", optional: true })
  declare room: string | null;

  @typedColumn({ type: "string", optional: true, columnName: "address_line1" })
  declare addressLine1: string | null;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ type: "string", optional: true })
  declare phone: string | null;

  @typedColumn({ type: "string", optional: true })
  declare email: string | null;

  @typedColumn({ type: "number", validator: vine.number().min(-90).max(90) })
  declare latitude: number;

  @typedColumn({ type: "number", validator: vine.number().min(-180).max(180) })
  declare longitude: number;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare photoKey: string | null;

  @typedColumn({ foreignKeyOf: () => Building, optional: true })
  declare buildingId: number | null;

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>;

  @hasMany(() => RegularHour)
  declare regularHours: HasMany<typeof RegularHour>;

  @hasMany(() => SpecialHour)
  declare specialHours: HasMany<typeof SpecialHour>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "photoKey",
  })
  declare photo: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
