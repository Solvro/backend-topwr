import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "food_spots";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("photo_url").nullable();
      table.setNullable("address_line1");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("photo_url");
      table.dropNullable("address_line1");
    });
  }
}
