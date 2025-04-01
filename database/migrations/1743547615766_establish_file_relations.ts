import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected readonly fileColumns: { tableName: string; columns: string[] }[] = [
    {
      tableName: "about_us_general",
      columns: ["cover_photo_key"],
    },
    {
      tableName: "aeds",
      columns: ["photo_key"],
    },
    {
      tableName: "bicycle_showers",
      columns: ["photo_key"],
    },
    {
      tableName: "buildings",
      columns: ["cover_key"],
    },
    {
      tableName: "campuses",
      columns: ["cover_key"],
    },
    {
      tableName: "change_screenshots",
      columns: ["image_key"],
    },
    {
      tableName: "contributors",
      columns: ["photo_key"],
    },
    {
      tableName: "departments",
      columns: ["logo_key"],
    },
    {
      tableName: "food_spots",
      columns: ["photo_key"],
    },
    {
      tableName: "guide_articles",
      columns: ["image_key"],
    },
    {
      tableName: "libraries",
      columns: ["photo_key"],
    },
    {
      tableName: "student_organizations",
      columns: ["logo_key", "cover_key"],
    },
    {
      tableName: "version_screenshots",
      columns: ["image_key"],
    },
  ];

  async up() {
    // strip extensions from column cells
    this.defer(async (db) => {
      for (const { tableName, columns } of this.fileColumns) {
        for (const column of columns) {
          await db.rawQuery(
            "UPDATE ?? SET ?? = regexp_replace(??, '\\..+', '') WHERE ?? IS NOT NULL;",
            [tableName, column, column, column],
          );
        }
      }
    });
    // change column types and establish relations
    for (const { tableName, columns } of this.fileColumns) {
      this.schema.alterTable(tableName, (table) => {
        for (const column of columns) {
          table.uuid(column).alter({ alterNullable: false, alterType: true });
          table
            .foreign(column)
            .references("file_entries.id")
            .onDelete("RESTRICT");
        }
      });
    }
  }

  async down() {
    // revert column type changes & drop relations
    for (const { tableName, columns } of this.fileColumns) {
      this.schema.alterTable(tableName, (table) => {
        for (const column of columns) {
          table.dropForeign(column);
        }
      });
      this.schema.alterTable(tableName, (table) => {
        for (const column of columns) {
          table.text(column).alter({ alterNullable: false, alterType: true });
        }
      });
    }
    // add extensions to column cells
    this.defer(async (db) => {
      for (const { tableName: table, columns } of this.fileColumns) {
        for (const column of columns) {
          await db.rawQuery(
            "UPDATE ?? SET ?? = ?? || '.' || files.file_extension FROM file_entries AS files WHERE CAST(?? AS uuid) = files.id;",
            [table, column, column, column],
          );
        }
      }
    });
  }
}
