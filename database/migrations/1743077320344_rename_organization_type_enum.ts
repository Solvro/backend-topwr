import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";
  protected oldName = "scientific_circle";
  protected newName = "scientific_club";

  async up() {
    this.schema.raw(
      `ALTER TYPE "organization_type" RENAME VALUE '${this.oldName}' TO '${this.newName}'`,
    );
  }

  async down() {
    this.schema.raw(
      `ALTER TYPE "organization_type" RENAME VALUE '${this.newName}' TO '${this.oldName}'`,
    );
  }
}
