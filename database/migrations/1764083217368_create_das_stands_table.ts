import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_stands";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table.string("number", 7).notNullable();
      table
        .integer("das_id")
        .references("id")
        .inTable("das")
        .notNullable()
        .onDelete("CASCADE");
      table.unique(["das_id", "number"]); // fake composite key
      table.string("name", 127).notNullable();
      table.string("floor", 7).nullable();
      table
        .integer("student_organization_id")
        .references("id")
        .inTable("student_organizations")
        .nullable()
        .onDelete("SET NULL");
      table.text("description").nullable();
      table
        .uuid("logo_key")
        .references("id")
        .inTable("file_entries")
        .nullable()
        .onDelete("RESTRICT");
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
