import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";
  protected organizationStatus = ["active", "inactive", "dissolved", "unknown"];
  protected organizationStatusDefault = this.organizationStatus[3];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("organization_status", this.organizationStatus, {
          useNative: true,
          enumName: "organization_status",
          existingType: false,
        })
        .defaultTo(this.organizationStatusDefault)
        .notNullable();
    });
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .update({ organization_status: this.organizationStatusDefault })
        .whereNull("organization_status");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("organization_status");
    });
    this.schema.raw('DROP TYPE IF EXISTS "organization_status"');
  }
}
