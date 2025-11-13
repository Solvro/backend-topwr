import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "push_notification_entries_topics";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("firebase_topic_topic_name", 48).notNullable();
      table.integer("push_notification_entry_id").unsigned().notNullable();
      table.primary([
        "firebase_topic_topic_name",
        "push_notification_entry_id",
      ]);
      table
        .foreign("push_notification_entry_id")
        .references("push_notification_entries.id")
        .onDelete("CASCADE");
      table
        .foreign("firebase_topic_topic_name")
        .references("firebase_topics.topic_name")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
