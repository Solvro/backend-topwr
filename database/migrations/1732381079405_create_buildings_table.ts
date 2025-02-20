import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";
  protected buildingIcons = ["ICON"];

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("identifier", 10).notNullable();
      table.text("special_name").nullable();
      table
        .enum("icon_type", this.buildingIcons, {
          useNative: true,
          enumName: "building_icon",
          existingType: false,
        })
        .notNullable();

      table.integer("campus_id").unsigned().notNullable();
      table
        .foreign("campus_id")
        .references("id")
        .inTable("campuses")
        .onDelete("CASCADE");

      table.text("address_line1").notNullable();
      table.text("address_line2").nullable();
      table.decimal("latitude").notNullable();
      table.decimal("longitude").notNullable();
      table.boolean("have_food").defaultTo(false);
      table.text("cover").notNullable();
      table.text("external_digital_guide_mode").nullable();
      table.text("external_digital_guide_id_or_url").nullable();
      table.check(
        `
        (
          external_digital_guide_mode = 'web_url'
          AND external_digital_guide_id_or_url ~ '^([a-zA-Z]+)://.*$' 
        ) 
        OR
        (
          external_digital_guide_mode <> 'web_url'
          AND external_digital_guide_id_or_url ~ '^[0-9]+$' 
        )
        OR
        (
          external_digital_guide_mode IS NULL
          AND external_digital_guide_id_or_url IS NULL
        )
      `,
        [],
        "digital_guide_format_check",
      );

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw('DROP TYPE IF EXISTS "building_icon"');
  }
}
