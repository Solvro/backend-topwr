import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "das_timetable_entries";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable("end_time");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("end_time");
    });
  }
}
