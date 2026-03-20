import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "departments";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("code", 30).notNullable().alter();
      table.string("better_code", 30).notNullable().alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("code", 3).notNullable().alter();
      table.string("better_code", 5).notNullable().alter();
    });
  }
}
