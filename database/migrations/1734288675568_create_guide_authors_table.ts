import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "guide_authors";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("name").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
