import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected readonly constraints: {
    table: string;
    foreign: string;
    references: string;
    oldAction: string;
    /*
     * Adonis autogenerates this from column and table names but there is a mismatch from previous migrations
     */
    constraint_name?: string;
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
      table: "regular_hours",
      foreign: "library_id",
      references: "libraries.id",
      oldAction: "CASCADE",
    },
    {
      table: "special_hours",
      foreign: "library_id",
      references: "libraries.id",
      oldAction: "CASCADE",
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
      table: "department_links",
      foreign: "department_id",
      references: "departments.id",
      oldAction: "RESTRICT",
      constraint_name: "departments_links_department_id_foreign", // 1744906324598 changed the name, but the constraint name stayed the same
    },
    {
      table: "day_swaps",
      foreign: "academic_calendar_id",
      references: "academic_calendars.id",
      oldAction: "CASCADE",
    },
    {
      table: "holidays",
      foreign: "academic_calendar_id",
      references: "academic_calendars.id",
      oldAction: "CASCADE",
    },
    {
      table: "contributor_social_links",
      foreign: "contributor_id",
      references: "contributors.id",
      oldAction: "CASCADE",
    },
    {
      table: "changes",
      foreign: "version_id",
      references: "versions.id",
      oldAction: "CASCADE",
    },
    {
      table: "change_screenshots",
      foreign: "change_id",
      references: "changes.id",
      oldAction: "CASCADE",
    },
    {
      table: "version_screenshots",
      foreign: "version_id",
      references: "versions.id",
      oldAction: "CASCADE",
    },
    {
      table: "student_organization_links",
      foreign: "student_organization_id",
      references: "student_organizations.id",
      oldAction: "CASCADE",
    },
    {
      table: "guide_questions",
      foreign: "article_id",
      references: "guide_articles.id",
      oldAction: "CASCADE",
    },
    {
      table: "guide_article_authors",
      foreign: "article_id",
      references: "guide_articles.id",
      oldAction: "CASCADE",
    },
    {
      table: "guide_article_authors",
      foreign: "author_id",
      references: "guide_authors.id",
      oldAction: "CASCADE",
    },
  ];

  async up() {
    for (const constraint of this.constraints) {
      this.schema.alterTable(constraint.table, (table) => {
        table.dropForeign(constraint.foreign, constraint.constraint_name);
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
          .foreign(constraint.foreign, constraint.constraint_name)
          .references(constraint.references)
          .onDelete(constraint.oldAction);
      });
    }
  }
}
