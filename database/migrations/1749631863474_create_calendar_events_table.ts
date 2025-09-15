import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "calendar_events";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.text("google_cal_id").nullable();
      table.text("name").notNullable();
      table.timestamp("start_time").notNullable();
      table.timestamp("end_time").notNullable();
      table.text("location").nullable();
      table.text("description").nullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
