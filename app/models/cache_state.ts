import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";
import type { TransactionClientContract } from "@adonisjs/lucid/types/database";

import { typedColumn } from "#app/decorators/typed_model";

export default class CacheState extends BaseModel {
  @typedColumn({ type: "number", isPrimary: true })
  declare id: number;

  @typedColumn.dateTime({})
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
