import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      -- assume all unknown organizations are active
      UPDATE "student_organizations"
      SET "organization_status"='active'
      WHERE "organization_status"='unknown';

      -- as there's no ALTER TYPE DELETE VALUE, we'll have to do a bit of extra work
      -- create a new type without that one value
      CREATE TYPE "new_organization_status"
      AS ENUM ('active', 'inactive', 'dissolved');

      -- add a column of the new type
      ALTER TABLE "student_organizations"
      ADD COLUMN "new_organization_status" "new_organization_status";

      -- copy the values, casting through TEXT
      UPDATE "student_organizations"
      SET "new_organization_status"=CAST(CAST("organization_status" AS TEXT) AS "new_organization_status");

      -- swap out the columns and mark the new one not null
      ALTER TABLE "student_organizations"
      DROP COLUMN "organization_status",
      ALTER COLUMN "new_organization_status" SET NOT NULL;

      -- you can't rename a column in the same statement :(
      ALTER TABLE "student_organizations"
      RENAME COLUMN "new_organization_status" TO "organization_status";

      -- drop old type, rename
      DROP TYPE "organization_status";
      ALTER TYPE "new_organization_status" RENAME TO "organization_status";
    `);
  }

  async down() {
    this.schema.raw(`
      -- we can just add the type back in
      ALTER TYPE "organization_status"
      ADD VALUE 'unknown';
    `);
  }
}
