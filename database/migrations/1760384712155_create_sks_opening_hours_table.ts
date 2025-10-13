import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "sks_opening_hours";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text("language").primary();

      table.text("canteen").notNullable();
      table.text("cafe").notNullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
