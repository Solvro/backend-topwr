import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "pink_boxes";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.text("room_or_nearby").nullable();
      table.text("floor").nullable();
      table.double("latitude").notNullable();
      table.double("longitude").notNullable();
      table.text("address_line").nullable();
      table.uuid("photo_key").nullable();

      table.integer("building_id").unsigned().nullable();
      table
        .foreign("building_id")
        .references("buildings.id")
        .onDelete("RESTRICT");

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
