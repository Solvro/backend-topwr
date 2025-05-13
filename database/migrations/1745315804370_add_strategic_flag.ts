import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "student_organizations";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_strategic").notNullable().defaultTo(false);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_strategic");
    });
  }
}
