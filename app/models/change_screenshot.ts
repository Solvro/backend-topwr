import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Change from "./change.js";

export default class ChangeScreenshot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare changeId: number;

  @column()
  declare imageKey: string;

  @column()
  declare subtitle: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Change)
  declare change: BelongsTo<typeof Change>;
}
