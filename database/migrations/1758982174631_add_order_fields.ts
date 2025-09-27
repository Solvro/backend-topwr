import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tables = ["contributors", "guide_articles", "guide_questions"];

  async up() {
    this.schema.raw(`
      CREATE FUNCTION order_autocompute() RETURNS trigger AS $$
        BEGIN
          IF NEW.order IS NULL THEN
            EXECUTE format('SELECT MAX("order") + 1 FROM %I', TG_TABLE_NAME)
            INTO STRICT NEW.order;

            IF NEW.order IS NULL THEN
              NEW.order := 1;
            END IF;
          END IF;

          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql
    `);
    for (const tableName of this.tables) {
      this.schema.raw(
        `
        ALTER TABLE "${tableName}"
          ADD COLUMN "order" REAL NULL;

        UPDATE "${tableName}"
        SET "order" = "id";

        ALTER TABLE "${tableName}"
          ALTER COLUMN "order" SET NOT NULL;

        CREATE TRIGGER order_autocompute
          BEFORE INSERT ON "${tableName}"
          FOR EACH ROW
          EXECUTE FUNCTION order_autocompute();
      `,
      );
    }
  }

  async down() {
    for (const tableName of this.tables) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn("order");
      });
    }
    this.schema.raw("DROP FUNCTION order_autocompute() CASCADE");
  }
}
