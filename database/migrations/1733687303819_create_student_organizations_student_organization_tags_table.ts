import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations_student_organization_tags";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text("tag").notNullable();
      table.integer("student_organization_id").unsigned().notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
      table.primary(["tag", "student_organization_id"]);
      table
        .foreign("student_organization_id")
        .references("student_organizations.id")
        .onDelete("CASCADE");
      table
        .foreign("tag")
        .references("student_organization_tags.tag")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
