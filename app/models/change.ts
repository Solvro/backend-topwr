import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { ChangeType } from "../enums/change_type.js";
import ChangeScreenshot from "./change_screenshot.js";
import Version from "./version.js";

export default class Change extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare type: ChangeType;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => ChangeScreenshot)
  declare screenshots: HasMany<typeof ChangeScreenshot>;

  @belongsTo(() => Version)
  declare version: BelongsTo<typeof Version>;
}
