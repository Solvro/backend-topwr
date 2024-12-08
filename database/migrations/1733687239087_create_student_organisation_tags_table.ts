import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_organisation_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text('tag').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.primary(['tag'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
