import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected branches = ["main", "jelenia_gora", "walbrzych", "legnica"];

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
    for (const [index, tableName] of this.tablesToChange.entries()) {
      this.schema.alterTable(tableName, (table) => {
        table
          .enum("branch", this.branches, {
            useNative: true,
            enumName: "branch",
            existingType: index !== 0, // pierwszy tworzysz, reszta używa
          })
          .defaultTo("main")
          .notNullable();
      });
    }

    for (const tableName of this.tablesToChange) {
      this.schema.raw(
        `ALTER TABLE "${tableName}" ALTER COLUMN "branch" DROP DEFAULT`,
      );
    }
  }

  async down() {
    for (const tableName of this.tablesToChange) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn("branch");
      });
    }

    this.schema.raw('DROP TYPE IF EXISTS "branch"');
  }
}
