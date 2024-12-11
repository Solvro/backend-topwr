import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "food_spots";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("name").notNullable();
      table.text("address_line1").notNullable();
      table.text("address_line2").nullable();
      table.decimal("latitude").notNullable();
      table.decimal("longitude").notNullable();

      table.bigInteger("building_id").unsigned().nullable();
      table
        .foreign("building_id")
        .references("buildings.id")
        .onDelete("SET NULL");

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
