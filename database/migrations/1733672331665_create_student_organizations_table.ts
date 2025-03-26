import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";
  protected sources = ["student_department", "manual", "pwr_active"];
  protected organizationType = [
    "scientific_club",
    "student_organization",
    "student_medium",
    "culture_agenda",
    "student_council",
  ];
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("name").notNullable();
      table.integer("department_id").unsigned().nullable();
      table.text("logo").nullable();
      table.text("cover").nullable();
      table.text("description").nullable();
      table.text("short_description").nullable();
      table.boolean("cover_preview").defaultTo(false).notNullable();
      table
        .enum("source", this.sources, {
          useNative: true,
          enumName: "source",
          existingType: false,
        })
        .notNullable();
      table
        .enum("organization_type", this.organizationType, {
          useNative: true,
          enumName: "organization_type",
          existingType: false,
        })
        .notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
      table
        .foreign("department_id")
        .references("departments.id")
        .onDelete("RESTRICT");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw('DROP TYPE IF EXISTS "source"');
    this.schema.raw('DROP TYPE IF EXISTS "organization_type"');
  }
}
