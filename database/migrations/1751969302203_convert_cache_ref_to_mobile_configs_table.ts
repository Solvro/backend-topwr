import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";
  protected oldTableName = "cache_reference_numbers";

  async up() {
    void this.schema.renameTable(this.oldTableName, this.tableName);
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("day_swap_lookahead").unsigned().notNullable().defaultTo(3);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("day_swap_lookahead");
    });
    void this.schema.renameTable(this.tableName, this.oldTableName);
  }
}
