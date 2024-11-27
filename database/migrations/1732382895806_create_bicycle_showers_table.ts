import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bicycle_showers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('room').nullable()
      table.text('instructions').nullable()
      table.decimal('latitude').notNullable()
      table.decimal('longitude').notNullable()
      table.text('addres_line1').notNullable()
      table.text('addres_line2').nullable()

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