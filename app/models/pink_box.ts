import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";

import Building from "./building.js";
import FileEntry from "./file_entry.js";

export default class PinkBox extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string", optional: true })
  declare roomOrNearby: string | null;

  @typedColumn({ type: "string", optional: true })
  declare floor: string | null;

  @typedColumn({ type: "string", optional: true })
  declare instructions: string | null;

  @typedColumn({ type: "number" })
  declare latitude: number;

  @typedColumn({ type: "number" })
  declare longitude: number;

  @typedColumn({ type: "string", optional: true, columnName: "address_line1" })
  declare addressLine1: string | null;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ type: "string", optional: true })
  declare photoKey: string | null;

  @typedColumn({ type: "string", optional: true })
  declare description: string | null;

  @typedColumn({ type: "integer", optional: true })
  declare buildingId: number | null;

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>;

  @belongsTo(() => FileEntry, {
    localKey: "photoKey",
    foreignKey: "id",
  })
  declare photo: BelongsTo<typeof FileEntry>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
