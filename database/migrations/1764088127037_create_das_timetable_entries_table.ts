import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_timetable_entries";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table
        .integer("timetable_id")
        .references("id")
        .inTable("das_timetables")
        .notNullable()
        .onDelete("CASCADE");
      table.text("name").notNullable();
      table.timestamp("start_time").notNullable();
      table.timestamp("end_time").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
