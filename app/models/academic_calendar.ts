import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import DaySwap from './day_swap.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Holiday from './holiday.js'

export default class AcademicCalendar extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare semesterStartDate: Date

  @column()
  declare examSessionStartDate: Date

  @column()
  declare examSessionLastDate: Date

  @column()
  declare isFirstWeekEven: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => DaySwap)
  declare daySwaps: HasMany<typeof DaySwap>

  @hasMany(() => Holiday)
  declare holidays: HasMany<typeof Holiday>
}
