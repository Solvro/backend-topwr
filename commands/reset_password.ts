import { inject } from "@adonisjs/core";
import { BaseCommand, args } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";

import ResetPasswordService from "#services/reset_password_service";

export default class ResetPassword extends BaseCommand {
  static commandName = "reset:password";
  static description =
    "Tries to reset the password for user associated with given email address";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    argumentName: "email",
    description:
      "Email address associated with user for whom the reseting is done",
  })
  declare email: string;

  @inject()
  async run(resetPasswordService: ResetPasswordService) {
    await resetPasswordService.trySendResetUrl(this.email);
  }
}
