import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'versions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('milestone_id').unsigned().notNullable()

      table.text('name').notNullable()
      table.date('release_date')
      table.text('description')

      // foreign keys
      table.foreign('milestone_id').references('milestones.id').onDelete('RESTRICT')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
