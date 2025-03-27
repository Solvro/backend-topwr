import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";
  protected newOrganizationType = [
    "scientific_club",
    "student_organization",
    "student_medium",
    "culture_agenda",
    "student_council",
  ];
  protected oldOrganizationType = [
    "scientific_circle",
    "student_organization",
    "student_medium",
    "culture_agenda",
    "student_council",
  ];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("organization_type");
    });
    this.schema.raw('DROP TYPE IF EXISTS "organization_type"');
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("organization_type", this.newOrganizationType, {
          useNative: true,
          enumName: "organization_type",
          existingType: false,
        })
        .notNullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("organization_type");
    });
    this.schema.raw('DROP TYPE IF EXISTS "organization_type"');
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("organization_type", this.oldOrganizationType, {
          useNative: true,
          enumName: "organization_type",
          existingType: false,
        })
        .notNullable();
    });
  }
}
