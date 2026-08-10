import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "hidden_events";

  private readonly googleCalIdColumnName = "google_cal_id";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.text(this.googleCalIdColumnName).primary();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
