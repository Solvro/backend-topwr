import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'departments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.text('name').notNullable()
      table.text('address_line1').notNullable()
      table.text('address_line2').nullable()
      table.string('code', 3).unique().notNullable()
      table.string('better_code', 5).unique().notNullable()
      table.text('logo').nullable()
      table.text('description').nullable()
      table.string('gradient_start', 7).notNullable()
      table.string('gradient_stop', 7).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}