import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { LinkType } from '../enums/link_type.js'
import Contributor from './contributor.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ContributorSocialLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare contributorId: number

  @column()
  declare linkType: LinkType

  @column()
  declare link: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Contributor)
  declare contributor: BelongsTo<typeof Contributor>
}
