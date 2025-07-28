import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "banners";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.text("title").notNullable();
      table.text("description").notNullable();
      table.text("url").nullable();

      table.boolean("draft").notNullable();

      table.integer("text_color").nullable();
      table.integer("background_color").nullable();
      table.integer("title_color").nullable();

      table.timestamp("visible_from").nullable();
      table.timestamp("visible_until").nullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
