import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "pink_boxes";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.text("room_or_nearby").nullable();
      table.text("floor").nullable();
      table.text("instructions").nullable();
      table.decimal("latitude").notNullable();
      table.decimal("longitude").notNullable();
      table.text("address_line1").nullable();
      table.text("address_line2").nullable();
      table.text("photo_url").nullable();
      table.text("description").nullable();

      table
        .integer("building_id")
        .unsigned()
        .references("id")
        .inTable("buildings")
        .onDelete("SET NULL")
        .nullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
