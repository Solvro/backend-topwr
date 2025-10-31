import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "firebase_topics";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string("topic_name", 48).primary();

      table.boolean("is_active").notNullable().defaultTo(true);
      table.timestamp("deactivated_at").nullable();
      table.text("description").nullable();
      table.timestamp("created_at");
      table.timestamp("updated_at");
      // To make sure the topic state is always valid
      table.check(
        "(is_active = TRUE AND deactivated_at IS NULL) OR (is_active = FALSE AND deactivated_at IS NOT NULL)",
        undefined,
        "topic_state_check",
      );
    });
    // TODO: Remove 'OR REPLACE' once #235 is completed
    this.schema.raw(
      `
            CREATE OR REPLACE FUNCTION get_fb_topic_state(deactivated_since TIMESTAMP)
            RETURNS TABLE
                    (
                        activeTopics      VARCHAR[],
                        deactivatedTopics VARCHAR[]
                    )
            AS
            $$
            BEGIN
                RETURN QUERY
                    SELECT COALESCE(ARRAY_AGG(tp.topic_name) FILTER (WHERE tp.is_active = TRUE), '{}')  AS activeTopics,
                           COALESCE(ARRAY_AGG(tp.topic_name) FILTER (WHERE tp.is_active = FALSE), '{}') AS deactivatedTopics
                    FROM firebase_topics tp
                    WHERE tp.is_active = TRUE
                       OR (tp.is_active = FALSE AND tp.deactivated_at >= deactivated_since);
            END;
            $$ LANGUAGE PLPGSQL;
                  `,
    );
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw("DROP FUNCTION get_fb_topic_state(TIMESTAMP)");
  }
}
