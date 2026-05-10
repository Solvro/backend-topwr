import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_stands";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("floor");
      table.dropColumn("student_organization_id");

      table
        .integer("floor_id")
        .references("id")
        .inTable("floors")
        .nullable()
        .onDelete("SET NULL");
      table
        .integer("das_organization_id")
        .references("id")
        .inTable("das_organizations")
        .nullable()
        .onDelete("SET NULL");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("floor_id");
      table.dropColumn("das_organization_id");

      table.string("floor", 7).nullable();
      table
        .integer("student_organization_id")
        .references("id")
        .inTable("student_organizations")
        .nullable()
        .onDelete("SET NULL");
    });
  }
}
