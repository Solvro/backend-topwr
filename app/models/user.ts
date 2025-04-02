import { DateTime } from "luxon";

import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { compose } from "@adonisjs/core/helpers";
import hash from "@adonisjs/core/services/hash";
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
}
