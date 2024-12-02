import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Contributor from './contributor.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Milestone extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Contributor, {
    pivotTable: 'contributor_roles',
    pivotColumns: ['role_id'],
    pivotTimestamps: true,
  })
  declare contributors: ManyToMany<typeof Contributor>
}
