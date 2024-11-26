import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'special_hours'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.date('special_date').notNullable()
      table.time('open_time').notNullable()
      table.time('close_time').notNullable()

      table.bigInteger('library_id').unsigned().notNullable()
      table.foreign('library_id').references('libraries.id').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
