import { DateTime } from "luxon";
import crypto from "node:crypto";

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
    const token = await this.generateResetPasswordToken(
      user,
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

  async resetPassword(user: User, password: string) {
    user.password = password;
    await this.destroyToken(user);
    logger.info(`Password changed for user ${user.email}`);
  }

  async destroyToken(user: User) {
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiration = null;
    await user.save();
  }

  /**
   * Generates random secure token for password reseting and stores it in database
   * Hashing before storing should be handled by `beforeSave()` hook in lucid
   *
   * @param user user instance to associate token with
   * @param expirationDate time till the token is valid. Pass DateTime instance using e.g. `DateTime.now().plus({minutes: 15})`
   * @returns generated token (not hashed)
   */
  async generateResetPasswordToken(
    user: User,
    expirationDate: DateTime<true>,
  ): Promise<string> {
    const token = crypto.randomUUID().toString();
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiration = expirationDate;
    await user.save();
    return token;
  }
}
