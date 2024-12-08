import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_organisation_links'
  protected linkTypes = [
    'website',
    'facebook',
    'instagram',
    'linkedin',
    'mailto:',
    'youtube',
    'github',
    'twitter',
    'tiktok',
    'discord',
    'twitch',
  ]

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('student_organisation_id').unsigned().notNullable()
      table
        .enum('type', this.linkTypes, {
          useNative: true,
          enumName: 'organization_link_type',
          existingType: false,
        })
        .notNullable()
      table.text('link').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table
        .foreign('student_organisation_id')
        .references('student_organisations.id')
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "organization_link_type"')
  }
}
