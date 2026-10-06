import { DateTime } from "luxon";

import { BaseModel, column } from "@adonisjs/lucid/orm";
import type { TransactionClientContract } from "@adonisjs/lucid/types/database";

export default class CacheState extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column.dateTime()
  declare lastModifiedAt: DateTime;

  public static async touchGlobalLastModified(
    trx?: TransactionClientContract,
  ): Promise<void> {
    const state = await CacheState.query(
      trx === undefined ? undefined : { client: trx },
    ).firstOrFail();

    state.lastModifiedAt = DateTime.now();
    await state.save();
  }
}
