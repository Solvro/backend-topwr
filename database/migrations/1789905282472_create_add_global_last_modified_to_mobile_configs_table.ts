import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .timestamp("global_last_modified_at")
        .notNullable()
        .defaultTo(this.now());
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("global_last_modified_at");
    });
  }
}
