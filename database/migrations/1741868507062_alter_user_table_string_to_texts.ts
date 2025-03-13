import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "users";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("full_name").alter({ alterNullable: false, alterType: true });
      table.text("email").alter({ alterNullable: false, alterType: true });
      table.text("password").alter({ alterNullable: false, alterType: true });
      table
        .text("reset_password_token")
        .alter({ alterNullable: false, alterType: true });
    });
  }
}
