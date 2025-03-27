import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organization_links";
  protected linkTypes = [
    "topwr:buildings",
    "tel",
    "mailto:",
    "default",
    "facebook",
    "instagram",
    "discord",
    "linkedin",
    "github",
    "https://x.com",
    "youtu",
    "tiktok",
    "twitch",
  ];

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.integer("student_organization_id").unsigned().notNullable();
      table
        .enum("link_type", this.linkTypes, {
          useNative: true,
          enumName: "link_type",
          existingType: true,
        })
        .notNullable();
      table.text("link").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
      table
        .foreign("student_organization_id")
        .references("student_organizations.id")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
