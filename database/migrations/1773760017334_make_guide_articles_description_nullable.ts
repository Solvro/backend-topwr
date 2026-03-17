import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    // Make columns nullable first, then convert empty strings to null
    this.schema.alterTable("guide_articles", (table) => {
      table.text("description").nullable().alter();
    });
    this.schema.alterTable("guide_article_drafts", (table) => {
      table.text("description").nullable().alter();
    });

    await this.db.rawQuery(
      `UPDATE guide_articles SET description = NULL WHERE description = ''`,
    );
    await this.db.rawQuery(
      `UPDATE guide_article_drafts SET description = NULL WHERE description = ''`,
    );
  }

  async down() {
    await this.db.rawQuery(
      `UPDATE guide_articles SET description = '' WHERE description IS NULL`,
    );
    await this.db.rawQuery(
      `UPDATE guide_article_drafts SET description = '' WHERE description IS NULL`,
    );

    this.schema.alterTable("guide_articles", (table) => {
      table.text("description").notNullable().alter();
    });
    this.schema.alterTable("guide_article_drafts", (table) => {
      table.text("description").notNullable().alter();
    });
  }
}
