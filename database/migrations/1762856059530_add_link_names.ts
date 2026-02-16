import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected linkTables = [
    "about_us_general_links",
    "contributor_social_links",
    "student_organization_links",
  ];
  protected nameColumn = "name";

  async up() {
    for (const tableName of this.linkTables) {
      this.schema.alterTable(tableName, (table) => {
        table.string(this.nameColumn).nullable();
      });
    }
  }

  async down() {
    for (const tableName of this.linkTables) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn(this.nameColumn);
      });
    }
  }
}
