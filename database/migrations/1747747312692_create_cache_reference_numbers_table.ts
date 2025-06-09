import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "cache_reference_numbers";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.integer("reference_number").unsigned().notNullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });

    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT single_row CHECK (id = 1);`,
    );
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
