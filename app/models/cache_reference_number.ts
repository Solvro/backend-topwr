import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";

import { typedColumn } from "#decorators/typed_model";

export default class CacheReferenceNumber extends BaseModel {
  @typedColumn({ isPrimary: true, type: "number" })
  declare id: number;

  @typedColumn({ type: "number" })
  declare referenceNumber: number;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
