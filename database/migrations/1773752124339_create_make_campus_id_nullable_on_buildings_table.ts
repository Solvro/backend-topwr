import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("campus_id").unsigned().nullable().alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("campus_id").unsigned().notNullable().alter();
    });
  }
}
