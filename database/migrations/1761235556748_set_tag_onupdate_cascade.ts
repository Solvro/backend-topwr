import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations_student_organization_tags";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign("tag");
      table
        .foreign("tag")
        .references("student_organization_tags.tag")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign("tag");
      table
        .foreign("tag")
        .references("student_organization_tags.tag")
        .onDelete("CASCADE");
    });
  }
}
