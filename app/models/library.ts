import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Building from './building.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import RegularHour from './regular_hour.js'
import SpecialHour from './special_hour.js'

export default class Library extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare room: string | null

  @column()
  declare addressLine1: string

  @column()
  declare addressLine2: string | null

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare buildingId: number | null

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>

  @hasMany(() => RegularHour)
  declare regularHours: HasMany<typeof RegularHour>

  @hasMany(() => SpecialHour)
  declare specialHours: HasMany<typeof SpecialHour>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
