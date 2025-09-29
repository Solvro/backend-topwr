import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected branches = ["main", "jelenia_gora", "walbrzych", "legnica"];
  protected tableName = "departments";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("branch", this.branches, {
          useNative: true,
          enumName: "branch",
          existingType: true,
        })
        .defaultTo("main")
        .notNullable();
    });

    this.schema.raw(
      `ALTER TABLE "${this.tableName}" ALTER COLUMN "branch" DROP DEFAULT`,
    );

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_branch");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_branch").defaultTo(false).notNullable();
    });

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("branch");
    });
  }
}
