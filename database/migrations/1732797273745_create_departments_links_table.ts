import { BaseSchema } from "@adonisjs/lucid/schema";

import { linkTypeOrder } from "#enums/link_type";

export default class extends BaseSchema {
  protected tableName = "departments_links";
  protected linkTypes = linkTypeOrder.map((linkType) => linkType.valueOf());

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.integer("department_id").unsigned().notNullable();
      table
        .foreign("department_id")
        .references("departments.id")
        .onDelete("CASCADE");

      table
        .enum("link_type", this.linkTypes, {
          useNative: true,
          enumName: "link_type",
          existingType: false,
        })
        .notNullable();

      table.text("link").notNullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw('DROP TYPE IF EXISTS "link_type"');
  }
}
