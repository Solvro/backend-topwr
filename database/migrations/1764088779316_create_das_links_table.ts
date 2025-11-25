import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_links";

  protected linkTypes = [
    "default",
    "facebook",
    "instagram",
    "linkedin",
    "mailto:",
    "youtu",
    "github",
    "topwr:buildings",
    "tel",
    "https://x.com",
    "tiktok",
    "discord",
    "twitch",
  ];

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").notNullable();
      table
        .integer("das_id")
        .references("id")
        .inTable("das")
        .notNullable()
        .onDelete("CASCADE");
      table.primary(["das_id", "id"]);
      table.text("link").notNullable();
      table
        .enum("type", this.linkTypes, {
          useNative: true,
          enumName: "link_type",
          existingType: true,
        })
        .notNullable();
      table.string("title", 127).notNullable();
      table.text("subtitle").nullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
