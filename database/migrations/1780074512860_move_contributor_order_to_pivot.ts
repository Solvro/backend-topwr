import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    // 1. Remove trigger from contributors (function stays – used by guide_articles and guide_questions)
    this.schema.raw(
      `DROP TRIGGER IF EXISTS order_autocompute ON "contributors"`,
    );

    // 2. Remove order column from contributors
    this.schema.alterTable("contributors", (table) => {
      table.dropColumn("order");
    });

    // 3. Add order to contributor_roles pivot with per-milestone auto-compute trigger
    this.schema.raw(`
      ALTER TABLE "contributor_roles"
        ADD COLUMN "order" REAL NULL;

      WITH ranked AS (
        SELECT DISTINCT contributor_id, milestone_id,
          ROW_NUMBER() OVER (PARTITION BY milestone_id ORDER BY contributor_id) AS rn
        FROM contributor_roles
      )
      UPDATE contributor_roles cr
      SET "order" = r.rn
      FROM ranked r
      WHERE cr.contributor_id = r.contributor_id AND cr.milestone_id = r.milestone_id;

      ALTER TABLE "contributor_roles"
        ALTER COLUMN "order" SET NOT NULL;

      CREATE FUNCTION contributor_roles_order_autocompute() RETURNS trigger AS $$
        BEGIN
          IF NEW.order IS NULL THEN
            SELECT "order" INTO NEW.order
            FROM contributor_roles
            WHERE milestone_id = NEW.milestone_id AND contributor_id = NEW.contributor_id
            LIMIT 1;

            IF NEW.order IS NULL THEN
              SELECT MAX("order") + 1 INTO STRICT NEW.order
              FROM contributor_roles
              WHERE milestone_id = NEW.milestone_id;

              IF NEW.order IS NULL THEN
                NEW.order := 1;
              END IF;
            END IF;
          END IF;

          RETURN NEW;
        END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER contributor_roles_order_autocompute
        BEFORE INSERT ON "contributor_roles"
        FOR EACH ROW
        EXECUTE FUNCTION contributor_roles_order_autocompute();
    `);
  }

  async down() {
    // Remove pivot order trigger and column
    this.schema.raw(`
      DROP TRIGGER IF EXISTS contributor_roles_order_autocompute ON "contributor_roles";
      DROP FUNCTION IF EXISTS contributor_roles_order_autocompute();
    `);

    this.schema.alterTable("contributor_roles", (table) => {
      table.dropColumn("order");
    });

    // Restore order on contributors
    this.schema.raw(`
      ALTER TABLE "contributors"
        ADD COLUMN "order" REAL NULL;

      UPDATE "contributors"
      SET "order" = "id";

      ALTER TABLE "contributors"
        ALTER COLUMN "order" SET NOT NULL;

      CREATE TRIGGER order_autocompute
        BEFORE INSERT ON "contributors"
        FOR EACH ROW
        EXECUTE FUNCTION order_autocompute();
    `);
  }
}
