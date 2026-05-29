import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("booths_api_base_url").nullable();
      table.boolean("booths_enabled").notNullable().defaultTo(false);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns("booths_api_base_url", "booths_enabled");
    });
  }
}
