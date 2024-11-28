import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { LinkType } from '../enums/link_type.js'
import Department from './department.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DepartmentsLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare department_id: string

  @column()
  declare link_type: LinkType

  @column()
  declare link: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>
}
