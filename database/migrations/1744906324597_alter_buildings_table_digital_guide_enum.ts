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
        .string("external_digital_guide_mode")
        .alter({ alterNullable: false, alterType: true });
      table
        .enum("external_digital_guide_mode", this.digitalGuideModes, {
          useNative: true,
          enumName: "external_digital_guide_mode",
          existingType: false,
        })
        // .defaultTo(null)
        .alter({ alterNullable: false, alterType: true });
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .text("external_digital_guide_mode")
        .alter({ alterNullable: false, alterType: true });
    });
    this.schema.raw(`DROP TYPE IF EXISTS "external_digital_guide_mode"`);
  }
}
