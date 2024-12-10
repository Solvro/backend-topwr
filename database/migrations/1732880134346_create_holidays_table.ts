import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "holidays";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.bigInteger("academic_calendar_id").unsigned().notNullable();
      table
        .foreign("academic_calendar_id")
        .references("academic_calendars.id")
        .onDelete("CASCADE");

      table.date("start_date").notNullable();
      table.date("last_date").notNullable();
      table.text("description").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
