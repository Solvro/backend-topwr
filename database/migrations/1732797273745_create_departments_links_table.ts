import { BaseSchema } from '@adonisjs/lucid/schema'
import { LinkType } from '../../app/enums/link_type.js'

export default class extends BaseSchema {
  protected tableName = 'departments_links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable

      table.integer('department_id').unsigned().references('departments.id').notNullable()

      table
        .enum('link_type', Object.values(LinkType), {
          useNative: true,
          enumName: 'link_type',
          existingType: false,
        })
        .notNullable()

      table.text('link').notNullable()

      table.timestamp('created_at').notNullable
      table.timestamp('updated_at').notNullable
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
