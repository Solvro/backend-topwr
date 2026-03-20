import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable("campus_id");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("campus_id");
    });
  }
}
