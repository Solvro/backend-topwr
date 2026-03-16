import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "mobile_configs";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .text("sks_microservice_url")
        .notNullable()
        .defaultTo("https://sks-api.topwr.solvro.pl/");
      table
        .text("parking_microservice_url")
        .notNullable()
        .defaultTo("https://parking-api.topwr.solvro.pl/");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns("sks_microservice_url", "parking_microservice_url");
    });
  }
}
