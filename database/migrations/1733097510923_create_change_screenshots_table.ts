import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'change_screenshots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('change_id')
        .unsigned()
        .notNullable()
        .references('changes.id')
        .onDelete('CASCADE')

      table.text('image_key').notNullable()
      table.text('subtitle')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
