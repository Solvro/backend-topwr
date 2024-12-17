import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "guide_questions";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("title").notNullable();
      table.text("answer").notNullable();
      table.integer("article_id").unsigned().notNullable();
      table
        .foreign("article_id")
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
