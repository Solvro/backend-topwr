import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "guide_article_authors";
  protected guideAuthorRoles = ["AUTHOR", "REDACTOR"];

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.integer("article_id").unsigned().notNullable();
      table
        .foreign("article_id")
        .references("guide_articles.id")
        .onDelete("CASCADE");
      table.integer("author_id").unsigned().notNullable();
      table
        .foreign("author_id")
        .references("guide_authors.id")
        .onDelete("CASCADE");
      table
        .enum("role", this.guideAuthorRoles, {
          useNative: true,
          enumName: "guide_author_role",
          existingType: true,
        })
        .notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
