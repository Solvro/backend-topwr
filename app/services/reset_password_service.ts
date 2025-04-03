import { DateTime } from "luxon";

import logger from "@adonisjs/core/services/logger";
import mail from "@adonisjs/mail/services/main";

import ResetPasswordNotification from "#mails/reset_password_notification";
import User from "#models/user";
import env from "#start/env";

export default class ResetPasswordService {
  async trySendResetUrl(email: string) {
    logger.info(`Reset password procedure started for email ${email}`);
    const user = await User.findBy("email", email);
    if (user === null) {
      logger.info(
        `No user associated ${email}, aborting reset password procedure`,
      );
      return;
    }
    const token = await user.generateResetPasswordToken(
      DateTime.now().plus({ minutes: 15 }),
    );
    await mail.send(
      new ResetPasswordNotification(
        email,
        `${env.get("APP_URL")}/admin/resetpassword/${token}`,
      ),
    );
    logger.info(`Reset password email sent to ${email}`);
  }
}
