import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contributor_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('contributor_id').unsigned().references('contributors.id').onDelete('CASCADE')
      table.integer('role_id').unsigned().references('roles.id').onDelete('RESTRICT')
      table.integer('milestone_id').unsigned().references('milestones.id').onDelete('RESTRICT')

      // implies NOT NULL on the fields
      table.primary(['contributor_id', 'role_id', 'milestone_id'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
