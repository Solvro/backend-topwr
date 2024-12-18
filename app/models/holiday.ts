import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import AcademicCalendar from "./academic_calendar.js";

export default class Holiday extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare academicCalendarId: number;

  @column.date()
  declare startDate: DateTime;

  @column.date()
  declare lastDate: DateTime;

  @column()
  declare description: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => AcademicCalendar)
  declare academicCalendar: BelongsTo<typeof AcademicCalendar>;
}
