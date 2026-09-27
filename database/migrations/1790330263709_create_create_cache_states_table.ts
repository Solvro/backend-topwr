import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "cache_states";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.timestamp("last_modified_at").notNullable().defaultTo(this.now());
    });

    this.defer(async (db) => {
      await db.table(this.tableName).insert({
        id: 1,
        last_modified_at: this.now(),
      });
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
