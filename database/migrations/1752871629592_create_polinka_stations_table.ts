import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "polinka_stations";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name", 10).notNullable();
      table.integer("campus_id").unsigned().notNullable();
      table
        .foreign("campus_id")
        .references("id")
        .inTable("campuses")
        .onDelete("RESTRICT");

      table.text("address_line1").notNullable();
      table.text("address_line2").nullable();
      table.double("latitude").notNullable();
      table.double("longitude").notNullable();
      table.text("photo_key").nullable();
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

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
