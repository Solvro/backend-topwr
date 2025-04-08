import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "buildings";

  async up() {
    // First create the enum type
    await this.db.rawQuery(`
      CREATE TYPE external_digital_guide_mode AS ENUM ('web_url', 'digital_guide_building', 'other_digital_guide_place')
    `);

    // Create a temporary column with the new type
    await this.db.rawQuery(`
      ALTER TABLE buildings ADD COLUMN temp_mode external_digital_guide_mode
    `);

    // Copy data with mapping
    await this.db.rawQuery(`
      UPDATE buildings SET temp_mode =
        CASE external_digital_guide_mode
          WHEN 'digital_guide_building' THEN 'digital_guide_building'::external_digital_guide_mode
          WHEN 'other_digital_guide_place' THEN 'other_digital_guide_place'::external_digital_guide_mode
          ELSE 'web_url'::external_digital_guide_mode
        END
    `);

    // Drop the old column
    await this.db.rawQuery(`
      ALTER TABLE buildings DROP COLUMN external_digital_guide_mode
    `);

    // Rename the temporary column
    await this.db.rawQuery(`
      ALTER TABLE buildings RENAME COLUMN temp_mode TO external_digital_guide_mode
    `);
  }

  async down() {
    // Create a temporary varchar column
    await this.db.rawQuery(`
      ALTER TABLE buildings ADD COLUMN temp_mode VARCHAR(255)
    `);

    // Copy data back to string format
    await this.db.rawQuery(`
      UPDATE buildings SET temp_mode = external_digital_guide_mode::text
    `);

    // Drop the enum column
    await this.db.rawQuery(`
      ALTER TABLE buildings DROP COLUMN external_digital_guide_mode
    `);

    // Rename temporary column
    await this.db.rawQuery(`
      ALTER TABLE buildings RENAME COLUMN temp_mode TO external_digital_guide_mode
    `);

    // Drop the enum type
    await this.db.rawQuery(`
      DROP TYPE IF EXISTS external_digital_guide_mode
    `);
  }
}
