import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "hidden_events";
  private calendarEventsTableName = "calendar_events";

  private googleCalIdColumnName = "google_cal_id";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string(this.googleCalIdColumnName).primary();
    });
    // Postgres indexing on text is bad
    this.schema.raw(
      `ALTER TABLE ${this.calendarEventsTableName} ALTER COLUMN ${this.googleCalIdColumnName} TYPE varchar;`,
    );
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw(
      `ALTER TABLE ${this.calendarEventsTableName} ALTER COLUMN ${this.googleCalIdColumnName} TYPE text;`,
    );
  }
}
