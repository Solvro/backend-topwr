import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn("reference_number", "cms_reference_number");
      table
        .integer("translator_reference_number")
        .unsigned()
        .notNullable()
        .defaultTo(1);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn("cms_reference_number", "reference_number");
      table.dropColumn("translator_reference_number");
    });
  }
}
