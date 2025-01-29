import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "about_us_general_links";
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
      table.increments("id");
      table
        .enum("link_type", this.linkTypes, {
          useNative: true,
          enumName: "link_type",
          existingType: true,
        })
        .notNullable();
      table.text("link").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
