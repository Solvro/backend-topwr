import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { BuildingIcon } from '../enums/building_icon.js'
import Campus from './campus.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Aed from './aed.js'
import BicycleShower from './bicycle_shower.js'
import FoodSpot from './food_spot.js'
import Library from './library.js'

export default class Building extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare identifier: string

  @column()
  declare specialName: string | null

  @column()
  declare iconType: BuildingIcon

  @column()
  declare campusId: number

  @column()
  declare addressLine1: string

  @column()
  declare addressLine2: string | null

  @column()
  declare latitude: number

  @column()
  declare longitude: number

  @column()
  declare haveFood: boolean

  @column()
  declare cover: string

  @belongsTo(() => Campus)
  declare campus: BelongsTo<typeof Campus>

  @hasMany(() => Aed)
  declare aeds: HasMany<typeof Aed>

  @hasMany(() => BicycleShower)
  declare bicycleShowers: HasMany<typeof BicycleShower>

  @hasMany(() => FoodSpot)
  declare foodSpots: HasMany<typeof FoodSpot>

  @hasMany(() => Library)
  declare libraries: HasMany<typeof Library>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}