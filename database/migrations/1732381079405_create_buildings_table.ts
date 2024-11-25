import { BaseSchema } from '@adonisjs/lucid/schema'
import { BuildingIcon } from '../../app/enums/building_icon.js'

export default class extends BaseSchema {
  protected tableName = 'buildings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('identifier', 10).notNullable()
      table.text('special_name').nullable()
      table
        .enum('icon_type', Object.values(BuildingIcon), {
          useNative: true,
          enumName: 'building_icon',
          existingType: false,
        })
        .notNullable()

      table.bigInteger('campus_id').unsigned().notNullable()
      table.foreign('campus_id').references('campuses.id').onDelete('CASCADE')

      table.text('addres_line1').notNullable()
      table.text('addres_line2').nullable()
      table.decimal('latitude').notNullable()
      table.decimal('longitude').notNullable()
      table.boolean('have_food').defaultTo(false)
      table.text('cover').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "building_icon"')
  }
}
