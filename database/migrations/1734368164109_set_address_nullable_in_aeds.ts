import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "aeds";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable("address_line1");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("address_line1");
    });
  }
}
