import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE student_organizations AS org
        SET is_strategic = TRUE
        FROM student_organizations_student_organization_tags AS pivot
        WHERE org.id = pivot.student_organization_id
          AND pivot.tag = 'strategiczne';
      `);
      await db.rawQuery(`
        DELETE FROM student_organization_tags
        WHERE tag = 'strategiczne';
      `);
    });
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO student_organization_tags (tag, created_at, updated_at)
        VALUES ('strategiczne', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
      `);
      await db.rawQuery(`
        INSERT INTO student_organizations_student_organization_tags (tag, student_organization_id, created_at, updated_at)
        SELECT 'strategiczne', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM student_organizations
          WHERE is_strategic = TRUE;
      `);
    });
  }
}
