import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'changes'
  protected changeTypes = ['FIX', 'FEATURE']

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('version_id')
        .unsigned()
        .notNullable()
        .references('versions.id')
        .onDelete('CASCADE')

      table
        .enum('type', this.changeTypes, {
          useNative: true,
          enumName: 'change_type',
          existingType: false,
        })
        .notNullable()

      table.text('name').notNullable()
      table.text('description')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "change_type"')
  }
}
