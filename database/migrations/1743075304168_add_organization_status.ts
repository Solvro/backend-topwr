import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";
  protected organizationStatus = ["active", "inactive", "dissolved", "unknown"];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("organization_status", this.organizationStatus, {
          useNative: true,
          enumName: "organization_status",
          existingType: false,
        })
        .notNullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("organization_status");
    });
    this.schema.raw('DROP TYPE IF EXISTS "organization_status"');
  }
}
