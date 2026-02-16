import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organization_drafts";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("name").notNullable();
      table.boolean("is_strategic").notNullable().defaultTo(false);

      table.integer("department_id").unsigned().nullable();
      table
        .foreign("department_id")
        .references("departments.id")
        .onDelete("RESTRICT");

      table.uuid("logo_key").nullable();
      table
        .foreign("logo_key")
        .references("file_entries.id")
        .onDelete("RESTRICT");

      table.uuid("cover_key").nullable();
      table
        .foreign("cover_key")
        .references("file_entries.id")
        .onDelete("RESTRICT");

      table.text("description").nullable();
      table.text("short_description").nullable();
      table.boolean("cover_preview").notNullable().defaultTo(false);

      table.text("en_name").nullable();
      table.text("en_short_description").nullable();
      table.text("en_description").nullable();

      table
        .enum("source", ["student_department", "manual", "pwr_active"], {
          useNative: true,
          enumName: "source",
          existingType: true,
        })
        .notNullable();

      table
        .enum(
          "organization_type",
          [
            "scientific_club",
            "student_organization",
            "student_medium",
            "culture_agenda",
            "student_council",
          ],
          {
            useNative: true,
            enumName: "organization_type",
            existingType: true,
          },
        )
        .notNullable();

      table
        .enum("organization_status", ["active", "inactive", "dissolved"], {
          useNative: true,
          enumName: "organization_status",
          existingType: true,
        })
        .notNullable()
        .defaultTo("active");

      table.integer("original_id").unsigned().nullable();
      table
        .foreign("original_id")
        .references("student_organizations.id")
        .onDelete("CASCADE");

      table.integer("created_by_user_id").unsigned().notNullable();
      table
        .foreign("created_by_user_id")
        .references("users.id")
        .onDelete("CASCADE");

      table
        .enum("branch", ["main", "jelenia_gora", "walbrzych", "legnica"], {
          useNative: true,
          enumName: "branch",
          existingType: true,
        })
        .defaultTo("main")
        .notNullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });

    // Add unique constraint: only one draft per organization (null original_id allowed for new articles)
    this.schema.raw(`
      CREATE UNIQUE INDEX student_organization_drafts_original_id_unique
      ON student_organization_drafts (original_id)
      WHERE original_id IS NOT NULL
    `);
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
