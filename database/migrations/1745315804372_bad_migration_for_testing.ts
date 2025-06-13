import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  async up() {
    // this.defer(async (db) => {
    await this.db.rawQuery(`
        INSERT INTO student_organization_tags (tag, created_at, updated_at)
        VALUES ('test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
    // });
  }

  async down() {
    // this.defer(async (db) => {
    await this.db.rawQuery(`
        DELETE FROM student_organization_tags
        WHERE tag = 'test';
      `);
    // });
  }
}
