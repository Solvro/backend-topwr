import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class Banner extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string", optional: false })
  declare title: string;

  @typedColumn({ type: "string", optional: false })
  declare description: string;

  @typedColumn({ type: "string", optional: true })
  declare url: string | null;

  @typedColumn({ type: "boolean", optional: false })
  declare draft: boolean;

  @typedColumn({ type: "number", optional: true })
  declare textColor: number | null;

  @typedColumn({ type: "number", optional: true })
  declare backgroundColor: number | null;

  @typedColumn({ type: "number", optional: true })
  declare titleColor: number | null;

  @typedColumn.dateTime({ optional: true })
  declare visibleFrom: DateTime | null;

  @typedColumn.dateTime({ optional: true })
  declare visibleUntil: DateTime | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
