import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "delete_building_icon";

  async up() {
    await this.schema.raw("DROP TYPE IF EXISTS building_icon");
  }

  async down() {
    await this.schema.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'building_icon') THEN
          CREATE TYPE building_icon AS ENUM ('ICON');
        END IF;
      END
      $$;
    `);
  }
}
