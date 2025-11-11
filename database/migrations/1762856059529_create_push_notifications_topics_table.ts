import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "push_notifications_topics";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("topic_name", 48).notNullable();
      table.integer("push_notification_id").unsigned().notNullable();
      table.primary(["topic_name", "push_notification_id"]);
      table
        .foreign("push_notification_id")
        .references("push_notifications.id")
        .onDelete("CASCADE");
      table
        .foreign("topic_name")
        .references("firebase_topics.topic_name")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
