import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Building from './building.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class FoodSpot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare addressLine1: string

  @column()
  declare addressLine2: string | null

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare buildingId: number | null

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
