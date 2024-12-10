import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Department from "./department.js";

export default class FieldsOfStudy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare department_id: number;

  @column()
  declare name: string;

  @column()
  declare url: string | null;

  @column()
  declare semester_count: number;

  @column()
  declare is_english: boolean;

  @column()
  declare is_2nd_degree: boolean;

  @column()
  declare has_weekend_option: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;
}
