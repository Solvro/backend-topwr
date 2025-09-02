import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "refresh_tokens";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary();
      table
        .bigint("for_user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.boolean("is_valid").notNullable().defaultTo(true);
      table.timestamp("expires_at").notNullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });

    this.schema.raw(`
        CREATE FUNCTION is_token_valid(
            token_id UUID,
            user_id BIGINT
        )
            RETURNS BOOLEAN AS '
        DECLARE
            expires_at TIMESTAMP WITH TIME ZONE;
        BEGIN
            SELECT rt.expires_at
            INTO expires_at
            FROM refresh_tokens rt
            WHERE rt.id = token_id
              AND rt.is_valid = true
              AND rt.for_user_id = user_id;
            IF expires_at IS NULL THEN
                RETURN FALSE;
            END IF;
            IF expires_at < NOW() THEN
                -- Token is expired
                DELETE FROM refresh_tokens WHERE id = token_id;
                RETURN FALSE;
            END IF;
            RETURN TRUE;
        END;
        ' LANGUAGE PLPGSQL;
    `);
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw("DROP FUNCTION get_user_id_for_valid_token(UUID)");
  }
}
