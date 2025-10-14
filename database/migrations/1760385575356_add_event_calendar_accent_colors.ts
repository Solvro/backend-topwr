import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "calendar_events";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("accent_color").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("accent_color");
    });
  }
}
