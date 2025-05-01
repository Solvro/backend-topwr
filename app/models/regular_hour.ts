import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { Weekday } from "#enums/weekday";

import Library from "./library.js";

export default class RegularHour extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: Weekday })
  declare weekDay: Weekday;

  @typedColumn({ type: "string" })
  declare openTime: string;

  @typedColumn({ type: "string" })
  declare closeTime: string;

  @typedColumn({ type: "integer" })
  declare libraryId: number;

  @belongsTo(() => Library)
  declare library: BelongsTo<typeof Library>;

  public static getLibraryRelationKey() {
    return "libraryId";
  }

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
