import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "about_us_general";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("description").notNullable();
      table.text("cover_photo_key").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
