import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_stands";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer("number").unsigned().notNullable();
      table
        .integer("das_id")
        .references("id")
        .inTable("das")
        .notNullable()
        .onDelete("CASCADE");
      table.primary(["number", "das_id"]);
      table.string("name", 127).notNullable().notNullable();
      table.string("floor", 15).notNullable().nullable();
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
        .onDelete("SET NULL");
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
