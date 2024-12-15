import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "guide_questions";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("title").notNullable();
      table.text("answer").notNullable();
      table
        .foreign("article_id")
        .references("guide_articles.id")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}