import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .boolean("killswitch_of_doom_and_despair")
        .notNullable()
        .defaultTo(false);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("killswitch_of_doom_and_despair");
    });
  }
}
