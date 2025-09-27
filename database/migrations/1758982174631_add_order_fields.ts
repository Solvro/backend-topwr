import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tables = ["contributors", "guide_articles", "guide_questions"];

  async up() {
    for (const tableName of this.tables) {
      this.schema.raw(
        `
        ALTER TABLE "${tableName}"
          ADD COLUMN "order" REAL NULL;

        UPDATE "${tableName}"
        SET "order" = "id";

        ALTER TABLE "${tableName}"
          ALTER COLUMN "order" SET NOT NULL;
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
  }
}
