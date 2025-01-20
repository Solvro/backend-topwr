import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Library from "./library.js";
import { Weekday } from "#enums/weekday";

export default class RegularHour extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare weekDay: Weekday;

  @column()
  declare openTime: string;

  @column()
  declare closeTime: string;

  @column()
  declare libraryId: number;

  @belongsTo(() => Library)
  declare library: BelongsTo<typeof Library>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
