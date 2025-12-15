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

      table.integer("original_id").unsigned().nullable();
      table
        .foreign("original_id")
        .references("guide_articles.id")
        .onDelete("CASCADE");

      table.integer("created_by_user_id").unsigned().notNullable();
      table
        .foreign("created_by_user_id")
        .references("users.id")
        .onDelete("CASCADE");

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });

    // Add unique constraint: only one draft per article (null original_id allowed for new articles)
    this.schema.raw(`
      CREATE UNIQUE INDEX guide_article_drafts_original_id_unique
      ON guide_article_drafts (original_id)
      WHERE original_id IS NOT NULL
    `);
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
