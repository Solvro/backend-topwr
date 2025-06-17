import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "fields_of_studies";
  protected studiesTypes = ["1DEGREE", "2DEGREE", "LONG_CYCLE"];

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum("studies_type", this.studiesTypes, {
          useNative: true,
          enumName: "studies_type",
          existingType: false,
        })
        .nullable();
    });
    this.defer(() =>
      this.db.rawQuery(`
        UPDATE ${this.tableName}
        SET studies_type = CASE
                             WHEN semester_count = 12 THEN 'LONG_CYCLE'::studies_type
                             WHEN is_2nd_degree = true THEN '2DEGREE'::studies_type
                             ELSE '1DEGREE'::studies_type
          END
      `),
    );
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("studies_type");
      table.dropColumn("is_2nd_degree");
      table.dropColumn("semester_count");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_2nd_degree").nullable();
      table.integer("semester_count").unsigned().nullable();
    });
    this.defer(() =>
      this.db.rawQuery(`
        UPDATE ${this.tableName}
        SET is_2nd_degree  = (studies_type = '2DEGREE'::studies_type),
            semester_count = CASE
                               WHEN studies_type = 'LONG_CYCLE'::studies_type THEN 12
                               WHEN studies_type = '2DEGREE'::studies_type THEN 4
                               ELSE 7
              END
      `),
    );
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("is_2nd_degree");
      table.dropNullable("semester_count");
      table.dropColumn("studies_type");
    });
    this.schema.raw(`DROP TYPE IF EXISTS "studies_type"`);
  }
}
