import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organization_links";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn("type", "link_type");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn("link_type", "type");
    });
  }
}
