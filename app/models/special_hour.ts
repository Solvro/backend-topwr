import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Library from "./library.js";

export default class SpecialHour extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn.date({
    prepare: (v: unknown) => (v instanceof Date ? v.toISOString() : v),
  })
  declare specialDate: DateTime;

  @typedColumn({ type: "string" })
  declare openTime: string;

  @typedColumn({ type: "string" })
  declare closeTime: string;

  @typedColumn({ type: "integer" })
  declare libraryId: number;

  @belongsTo(() => Library)
  declare library: BelongsTo<typeof Library>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
