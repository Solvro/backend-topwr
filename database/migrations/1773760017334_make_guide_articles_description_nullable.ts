import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    // Make columns nullable first, then convert empty strings to null
    this.schema.alterTable("guide_articles", (table) => {
      table.setNullable("description");
    });
    this.schema.alterTable("guide_article_drafts", (table) => {
      table.setNullable("description");
    });

    this.schema.raw(
      `UPDATE guide_articles SET description = NULL WHERE description = ''`,
    );
    this.schema.raw(
      `UPDATE guide_article_drafts SET description = NULL WHERE description = ''`,
    );
  }

  async down() {
    this.schema.raw(
      `UPDATE guide_articles SET description = '' WHERE description IS NULL`,
    );
    this.schema.raw(
      `UPDATE guide_article_drafts SET description = '' WHERE description IS NULL`,
    );

    this.schema.alterTable("guide_articles", (table) => {
      table.dropNullable("description");
    });
    this.schema.alterTable("guide_article_drafts", (table) => {
      table.dropNullable("description");
    });
  }
}
