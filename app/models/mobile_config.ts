import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";

import { typedColumn } from "#decorators/typed_model";

export default class MobileConfig extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare referenceNumber: number;

  @typedColumn({ type: "integer" })
  declare daySwapLookahead: number;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
