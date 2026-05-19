import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("identifier").notNullable().alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("identifier", 10).notNullable().alter();
    });
  }
}
