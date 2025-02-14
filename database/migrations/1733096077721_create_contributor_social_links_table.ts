import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "contributor_social_links";
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
      table.integer("contributor_id").unsigned().notNullable();

      table
        .enum("link_type", this.linkTypes, {
          useNative: true,
          enumName: "link_type",
          existingType: true,
        })
        .notNullable();

      table.text("link").notNullable();

      // prevent exact duplicates
      table.unique(["contributor_id", "link_type", "link"]);

      // foreign keys
      table
        .foreign("contributor_id")
        .references("contributors.id")
        .onDelete("CASCADE");

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
