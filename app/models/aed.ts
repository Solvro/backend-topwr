import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Building from './building.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Aed extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare addressLine1: string

  @column()
  declare addressLine2: string | null

  @column()
  declare photoUrl: string | null

  @column()
  declare buildingId: number | null

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
