import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table.timestamp("created_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
