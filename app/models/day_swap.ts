import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { Weekday } from '../enums/weekday.js'
import AcademicCalendar from './academic_calendar.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DaySwap extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare academicCalendarId: number

  @column()
  declare date: Date

  @column()
  declare changedWeekday: Weekday

  @column()
  declare changedDayIsEven: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => AcademicCalendar)
  declare academicCalendar: BelongsTo<typeof AcademicCalendar>
}
