import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableNames = [
    "buildings",
    "bicycle_showers",
    "food_spots",
    "libraries",
    "aeds",
  ];

  async up() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table
          .double("longitude")
          .alter({ alterNullable: false, alterType: true });
        table
          .double("latitude")
          .alter({ alterNullable: false, alterType: true });
      });
    }
  }

  async down() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table
          .decimal("longitude")
          .alter({ alterNullable: false, alterType: true });
        table
          .decimal("latitude")
          .alter({ alterNullable: false, alterType: true });
      });
    }
  }
}
