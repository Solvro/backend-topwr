import { DateTime } from "luxon";
import type { UUID } from "node:crypto";

import { BaseModel } from "@adonisjs/lucid/orm";
import db from "@adonisjs/lucid/services/db";

import { typedColumn } from "#decorators/typed_model";
import User from "#models/user";

export default class RefreshToken extends BaseModel {
  @typedColumn({ type: "uuid", isPrimary: true })
  declare id: UUID;

  @typedColumn({ foreignKeyOf: () => User, optional: false })
  declare forUserId: number;

  @typedColumn({ type: "boolean" })
  declare isValid: boolean;

  @typedColumn.dateTime({ autoCreate: false })
  declare expiresAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  public static async isTokenValid(
    tokenId: UUID,
    userId: number,
  ): Promise<boolean> {
    return db.rawQuery<boolean>(
      "SELECT * FROM is_token_valid(?, ?)",
      [tokenId, userId],
      { mode: "write" },
    );
  }

  public static async invalidateToken(tokenId: UUID): Promise<void> {
    await db.rawQuery(
      "UPDATE refresh_tokens SET is_valid = false WHERE id = ?",
      [tokenId],
      { mode: "write" },
    );
  }

  public static async invalidateAllTokensForUser(
    userId: number,
  ): Promise<void> {
    await db.rawQuery(
      "UPDATE refresh_tokens SET is_valid = false WHERE for_user_id = ?",
      [userId],
      { mode: "write" },
    );
  }
}
