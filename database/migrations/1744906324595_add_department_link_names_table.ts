import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "departments_links";
  protected defaultName = "Unknown";
  protected nameColumn = "name";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string(this.nameColumn).defaultTo(this.defaultName).notNullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn(this.nameColumn);
    });
  }
}
