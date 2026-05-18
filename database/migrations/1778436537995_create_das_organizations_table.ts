import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_organizations";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();
      table.text("name").notNullable();
      table.text("description").nullable();
      table
        .uuid("logo_key")
        .references("id")
        .inTable("file_entries")
        .nullable()
        .onDelete("RESTRICT");
      table
        .integer("student_organization_id")
        .references("id")
        .inTable("student_organizations")
        .nullable()
        .onDelete("SET NULL");

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
