import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tablesToChange = [
    "aeds",
    "bicycle_showers",
    "buildings",
    "campuses",
    "food_spots",
    "libraries",
    "pink_boxes",
    "polinka_stations",
    "student_organizations",
  ];

  async up() {
    for (const tableName of this.tablesToChange) {
      await this.schema.raw(
        `ALTER TABLE "${tableName}" ALTER COLUMN "branch" DROP DEFAULT`,
      );
    }
  }

  async down() {
    for (const tableName of this.tablesToChange) {
      await this.schema.raw(
        `ALTER TABLE "${tableName}" ALTER COLUMN "branch" SET DEFAULT 'main'`,
      );
    }
  }
}
