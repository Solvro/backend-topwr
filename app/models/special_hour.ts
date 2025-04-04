import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Library from "./library.js";

export default class SpecialHour extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare specialDate: DateTime;

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
