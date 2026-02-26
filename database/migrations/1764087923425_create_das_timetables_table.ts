import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_timetables";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer("id")
        .references("id")
        .inTable("das")
        .primary()
        .onDelete("CASCADE"); // Id mapping
      table.text("name").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
