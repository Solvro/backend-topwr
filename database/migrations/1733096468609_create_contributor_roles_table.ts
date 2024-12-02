import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contributor_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('contributor_id').unsigned()
      table.integer('role_id').unsigned()
      table.integer('milestone_id').unsigned()

      // implies NOT NULL on the fields
      table.primary(['contributor_id', 'role_id', 'milestone_id'])

      // foreign keys
      table.foreign('contributor_id').references('contributors.id').onDelete('CASCADE')
      table.foreign('role_id').references('roles.id').onDelete('RESTRICT')
      table.foreign('milestone_id').references('milestones.id').onDelete('RESTRICT')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
