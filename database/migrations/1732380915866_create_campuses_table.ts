import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "campuses";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("name").notNullable();
      table.text("cover").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
