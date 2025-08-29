import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected readonly constraints: {
    table: string;
    foreign: string;
    references: string;
    oldAction: string;
  }[] = [
    {
      table: "buildings",
      foreign: "campus_id",
      references: "campuses.id",
      oldAction: "CASCADE",
    },
    {
      table: "food_spots",
      foreign: "building_id",
      references: "buildings.id",
      oldAction: "SET NULL",
    },
    {
      table: "aeds",
      foreign: "building_id",
      references: "buildings.id",
      oldAction: "SET NULL",
    },
    {
      table: "libraries",
      foreign: "building_id",
      references: "buildings.id",
      oldAction: "SET NULL",
    },
    {
      table: "bicycle_showers",
      foreign: "building_id",
      references: "buildings.id",
      oldAction: "SET NULL",
    },
    {
      table: "fields_of_studies",
      foreign: "department_id",
      references: "departments.id",
      oldAction: "CASCADE",
    },
    {
      table: "guide_questions",
      foreign: "article_id",
      references: "guide_articles.id",
      oldAction: "CASCADE",
    },
  ];

  async up() {
    for (const constraint of this.constraints) {
      this.schema.alterTable(constraint.table, (table) => {
        table.dropForeign(constraint.foreign);
        table
          .foreign(constraint.foreign)
          .references(constraint.references)
          .onDelete("RESTRICT");
      });
    }
  }

  async down() {
    for (const constraint of this.constraints) {
      this.schema.alterTable(constraint.table, (table) => {
        table.dropForeign(constraint.foreign);
        table
          .foreign(constraint.foreign)
          .references(constraint.references)
          .onDelete(constraint.oldAction);
      });
    }
  }
}
