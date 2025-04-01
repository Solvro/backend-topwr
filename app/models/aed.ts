import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Building from "./building.js";

export default class Aed extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare latitude: number;

  @column()
  declare longitude: number;

  @column({ columnName: "address_line1" })
  declare addressLine1: string | null;

  @column({ columnName: "address_line2" })
  declare addressLine2: string | null;

  @column()
  declare photoKey: string | null;

  @column()
  declare buildingId: number | null;

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
