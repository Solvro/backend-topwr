import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "guide_article_drafts";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("title").notNullable();
      table.text("short_desc").notNullable();
      table.text("description").notNullable();

      table.uuid("image_key").notNullable();
      table
        .foreign("image_key")
        .references("file_entries.id")
        .onDelete("RESTRICT");

      table.integer("original_article_id").unsigned().nullable();
      table
        .foreign("original_article_id")
        .references("guide_articles.id")
        .onDelete("CASCADE");

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
