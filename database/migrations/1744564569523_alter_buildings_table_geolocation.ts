import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";
  protected digitalGuideModes = [
    "web_url",
    "digital_guide_building",
    "other_digital_guide_place",
  ];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .double("longitude")
        .alter({ alterNullable: false, alterType: true });
      table.double("latitude").alter({ alterNullable: false, alterType: true });
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .decimal("longitude")
        .alter({ alterNullable: false, alterType: true });
      table
        .decimal("latitude")
        .alter({ alterNullable: false, alterType: true });
    });
  }
}
