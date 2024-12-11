import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableNames = [
    "campuses",
    "buildings",
    "food_spots",
    "aeds",
    "libraries",
    "regular_hours",
    "special_hours",
    "bicycle_showers",
    "academic_calendars",
    "day_swaps",
    "holidays",
  ];

  async up() {
    for (const tableName of this.tableNames) {
      this.schema.table(tableName, (table) => {
        table.dropNullable("created_at");
        table.dropNullable("updated_at");
      });
    }
  }

  async down() {
    for (const tableName of this.tableNames) {
      this.schema.table(tableName, (table) => {
        table.setNullable("created_at");
        table.setNullable("updated_at");
      });
    }
  }
}
