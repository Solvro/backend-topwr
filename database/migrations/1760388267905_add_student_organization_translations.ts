import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("en_name").nullable();
      table.text("en_short_description").nullable();
      table.text("en_description").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("en_name");
      table.dropColumn("en_short_description");
      table.dropColumn("en_description");
    });
  }
}
