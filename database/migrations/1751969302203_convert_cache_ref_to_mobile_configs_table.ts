import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";
  protected oldTableName = "cache_reference_numbers";

  async up() {
    this.schema.raw(
      `ALTER TABLE ${this.oldTableName} RENAME TO ${this.tableName}`,
    );
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("day_swap_lookahead").unsigned().notNullable().defaultTo(3);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("day_swap_lookahead");
    });
    this.schema.raw(
      `ALTER TABLE ${this.tableName} RENAME TO ${this.oldTableName}`,
    );
  }
}
