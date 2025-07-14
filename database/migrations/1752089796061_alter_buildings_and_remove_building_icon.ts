import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";
  protected buildingIcons = ["ICON"];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("icon_type");
    });

    this.defer(() => this.db.rawQuery("DROP TYPE IF EXISTS building_icon"));
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("icon_type", this.buildingIcons, {
          useNative: true,
          enumName: "building_icon",
          existingType: false,
        })
        .notNullable()
        .defaultTo("ICON");
    });
  }
}
