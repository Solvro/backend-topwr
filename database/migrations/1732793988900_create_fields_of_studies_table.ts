import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fields_of_studies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table.integer('department_id').unsigned().references('departments.id').notNullable()

      table.text('name').notNullable()
      table.text('url').nullable()
      table.integer('semester_count').unsigned().notNullable()
      table.boolean('is_english').notNullable()
      table.boolean('is_2nd_degree').notNullable()
      table.boolean('has_weekend_option').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}