import { DateTime } from "luxon";
import crypto from "node:crypto";

import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { compose } from "@adonisjs/core/helpers";
import hash from "@adonisjs/core/services/hash";
import { BaseModel, beforeSave, column, scope } from "@adonisjs/lucid/orm";

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
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(user.resetPasswordToken, "utf-8")
        .digest("hex");
    }
  }

  static compareTokens = scope((query, token: string) => {
    void query.where(
      "reset_password_token",
      crypto.createHash("sha256").update(token, "utf-8").digest("hex"),
    );
  });
}
