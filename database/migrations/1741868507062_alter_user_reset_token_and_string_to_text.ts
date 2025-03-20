import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("full_name").alter({ alterNullable: false, alterType: true });
      table.text("email").alter({ alterNullable: false, alterType: true });
      table.text("password").alter({ alterNullable: false, alterType: true });

      table.text("reset_password_token").nullable();
      table.timestamp("reset_password_token_expiration").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string("full_name")
        .alter({ alterNullable: false, alterType: true });
      table.string("email").alter({ alterNullable: false, alterType: true });
      table.string("password").alter({ alterNullable: false, alterType: true });

      table.dropColumn("reset_password_token");
      table.dropColumn("reset_password_token_expiration");
    });
  }
}
