import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "regular_hours";
  protected weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table
        .enum("week_day", this.weekdays, {
          useNative: true,
          enumName: "week_day",
          existingType: false,
        })
        .notNullable();
      table.time("open_time").notNullable();
      table.time("close_time").notNullable();

      table.integer("library_id").unsigned().notNullable();
      table
        .foreign("library_id")
        .references("libraries.id")
        .onDelete("CASCADE");

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw('DROP TYPE IF EXISTS "week_day"');
  }
}
