import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_organisations_student_organisation_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text('tag').notNullable()
      table.integer('student_organisation_id').unsigned().notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.primary(['tag', 'student_organisation_id'])
      table
        .foreign('student_organisation_id')
        .references('student_organisations.id')
        .onDelete('CASCADE')
      table.foreign('tag').references('student_organisation_tags.tag').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
