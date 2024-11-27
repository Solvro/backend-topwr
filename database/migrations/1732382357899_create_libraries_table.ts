import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'libraries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('title').notNullable()
      table.text('room').nullable()
      table.text('addres_line1').notNullable()
      table.text('addres_line2').nullable()
      table.text('phone').nullable()
      table.text('email').nullable()
      table.decimal('latitude').notNullable()
      table.decimal('longitude').notNullable()

      table.bigInteger('building_id').unsigned().nullable()
      table.foreign('building_id').references('buildings.id').onDelete('SET NULL')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}