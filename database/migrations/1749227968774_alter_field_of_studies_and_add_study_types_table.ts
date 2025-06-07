import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "fields_of_studies";
  protected studiesTypes = ["1DEGREE", "2DEGREE", "LONG_CYCLE"];

  async up() {
    await this.schema.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'studies_type') THEN
          CREATE TYPE "studies_type" AS ENUM (${this.studiesTypes.map((type) => `'${type}'`).join(", ")});
        END IF;
      END $$;
      DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = '${this.tableName}' AND column_name = 'studies_type'
        ) THEN ALTER TABLE "${this.tableName}" ADD COLUMN "studies_type" "studies_type" NULL;
        END IF;
      END $$;
    `);
    await this.db.rawQuery(`
      UPDATE ${this.tableName}
      SET studies_type = CASE
                   WHEN semester_count = 12 THEN 'LONG_CYCLE'::studies_type
                   WHEN is_2nd_degree = true THEN '2DEGREE'::studies_type
                   ELSE '1DEGREE'::studies_type
        END
    `);
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("studies_type");
      table.dropColumn("is_2nd_degree");
      table.dropColumn("semester_count");
    });
  }

  async down() {
    await this.schema.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = '${this.tableName}' AND column_name = 'is_2nd_degree'
        ) THEN ALTER TABLE "${this.tableName}" ADD COLUMN "is_2nd_degree" boolean NULL;
        END IF;
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = '${this.tableName}' AND column_name = 'semester_count'
        ) THEN ALTER TABLE "${this.tableName}" ADD COLUMN "semester_count" INTEGER NULL;
        END IF;
      END $$;
    `);
    await this.db.rawQuery(`
      UPDATE ${this.tableName}
      SET is_2nd_degree  = (studies_type = '2DEGREE'::studies_type),
          semester_count = CASE
                             WHEN studies_type = 'LONG_CYCLE'::studies_type THEN 12
                             WHEN studies_type = '2DEGREE'::studies_type THEN 4
                             ELSE 7
            END
    `);
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable("is_2nd_degree");
      table.dropNullable("semester_count");
      table.dropColumn("studies_type");
    });
    this.schema.raw(`DROP TYPE IF EXISTS "studies_type"`);
  }
}
