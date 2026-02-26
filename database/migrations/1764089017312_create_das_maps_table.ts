import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_maps";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table
        .integer("das_id")
        .references("id")
        .inTable("das")
        .notNullable()
        .onDelete("CASCADE");
      table.string("name", 127).notNullable();
      table
        .uuid("content_key")
        .references("id")
        .inTable("file_entries")
        .notNullable()
        .onDelete("RESTRICT");
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
