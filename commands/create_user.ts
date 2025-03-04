import { BaseCommand, args } from "@adonisjs/core/ace";
import { CommandOptions } from "@adonisjs/core/types/ace";

import User from "#models/user";

export default class CreateUser extends BaseCommand {
  static commandName = "create:user";
  static description = "Create a new user in the system";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    argumentName: "email",
    description: "Email address of the user",
  })
  declare email: string;

  @args.string({
    argumentName: "password",
    description: "Password for the user",
  })
  declare password: string;

  async run() {
    this.logger.info(`Creating user: ${this.email}`);
    await User.create({
      email: this.email,
      password: this.password,
    });
  }
}
