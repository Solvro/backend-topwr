import { BaseSchema } from '@adonisjs/lucid/schema'
import { Weekday } from '../../app/enums/weekday.js'

export default class extends BaseSchema {
  protected tableName = 'day_swaps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.bigInteger('academic_calendar_id').unsigned().notNullable()
      table.foreign('academic_calendar_id').references('academic_calendars.id').onDelete('CASCADE')

      table.date('date').notNullable()

      table.enum('changed_weekday', Object.values(Weekday), {
        useNative: true,
        enumName: 'weekday',
        existingType: false
      }).notNullable()

      table.boolean('changed_day_is_even').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS "weekday"')
    this.schema.dropTable(this.tableName)
  }
}