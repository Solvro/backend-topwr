import { DateTime } from "luxon";

import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { compose } from "@adonisjs/core/helpers";
import hash from "@adonisjs/core/services/hash";
import logger from "@adonisjs/core/services/logger";
import { BaseModel, beforeSave, column, scope } from "@adonisjs/lucid/orm";

import { sha256 } from "#utils/hash";

const AuthFinder = withAuthFinder(() => hash.use("scrypt"), {
  uids: ["email"],
  passwordColumnName: "password",
});

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare fullName: string | null;

  @column()
  declare email: string;

  @column({ serializeAs: null })
  declare password: string;

  @column({ serializeAs: null })
  declare resetPasswordToken: string | null;

  @column({ serializeAs: null })
  declare resetPasswordTokenExpiration: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null;

  @beforeSave()
  static async hashToken(user: User) {
    if (
      user.$dirty.resetPasswordToken !== undefined &&
      user.resetPasswordToken !== null
    ) {
      // deterministic hash for easier lookup
      user.resetPasswordToken = sha256(user.resetPasswordToken);
    }
  }

  static compareTokens = scope((query, token: string) => {
    void query.where("reset_password_token", sha256(token));
  });

  hasValidResetToken() {
    return (
      this.resetPasswordTokenExpiration !== null &&
      this.resetPasswordTokenExpiration >= DateTime.now()
    );
  }

  /**
   * Updates the user's password, invalidates any existing reset tokens and saves the model
   *
   * @param password new password
   */
  async resetPassword(password: string) {
    this.password = password;
    await this.destroyToken();
    logger.info(`Password changed for user ${this.email}`);
  }

  /**
   * Invalidates any existing reset tokens and saves the model
   */
  async destroyToken() {
    this.resetPasswordToken = null;
    this.resetPasswordTokenExpiration = null;
    await this.save();
  }

  /**
   * Generates random secure token for password reseting and stores it in database
   * Hashing before storing should be handled by `beforeSave()` hook in lucid
   * Note: saves the model
   *
   * @param expirationDate time till the token is valid. Pass DateTime instance using e.g. `DateTime.now().plus({minutes: 15})`
   * @returns generated token (not hashed)
   */
  async generateResetPasswordToken(
    expirationDate: DateTime<true>,
  ): Promise<string> {
    const token = crypto.randomUUID().toString();
    this.resetPasswordToken = token;
    this.resetPasswordTokenExpiration = expirationDate;
    await this.save();
    return token;
  }
}
