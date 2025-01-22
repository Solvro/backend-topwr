import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "about_us_general";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer("id").primary().defaultTo(1);
      table.text("description").notNullable();
      table.text("cover_photo_key").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });

    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT single_row CHECK (id = 1);`,
    );
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS single_row;`,
    );

    this.schema.dropTable(this.tableName);
  }
}
