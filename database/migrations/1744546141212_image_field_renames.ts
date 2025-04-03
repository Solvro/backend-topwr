import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected readonly renames: {
    tableName: string;
    columns: { old: string; new: string }[];
  }[] = [
    {
      tableName: "aeds",
      columns: [{ old: "photo_url", new: "photo_key" }],
    },
    {
      tableName: "bicycle_showers",
      columns: [{ old: "photo_url", new: "photo_key" }],
    },
    {
      tableName: "buildings",
      columns: [{ old: "cover", new: "cover_key" }],
    },
    {
      tableName: "campuses",
      columns: [{ old: "cover", new: "cover_key" }],
    },
    {
      tableName: "departments",
      columns: [{ old: "logo", new: "logo_key" }],
    },
    {
      tableName: "food_spots",
      columns: [{ old: "photo_url", new: "photo_key" }],
    },
    {
      tableName: "guide_articles",
      columns: [{ old: "image_path", new: "image_key" }],
    },
    {
      tableName: "libraries",
      columns: [{ old: "photo_url", new: "photo_key" }],
    },
    {
      tableName: "student_organizations",
      columns: [
        { old: "logo", new: "logo_key" },
        { old: "cover", new: "cover_key" },
      ],
    },
  ];

  async up() {
    for (const { tableName, columns } of this.renames) {
      this.schema.alterTable(tableName, (table) => {
        for (const { old, new: newName } of columns) {
          table.renameColumn(old, newName);
        }
      });
    }
  }

  async down() {
    for (const { tableName, columns } of this.renames.toReversed()) {
      this.schema.alterTable(tableName, (table) => {
        for (const { old, new: newName } of columns) {
          table.renameColumn(newName, old);
        }
      });
    }
  }
}
