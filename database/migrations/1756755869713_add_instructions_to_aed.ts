import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "aeds";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("instructions").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("instructions");
    });
  }
}
