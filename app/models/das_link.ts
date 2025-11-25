import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { LinkType } from "#enums/link_type";
import Das from "#models/das";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class DasLink extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ isPrimary: true, foreignKeyOf: () => Das })
  declare dasId: number;

  @belongsTo(() => Das, {
    localKey: "id",
    foreignKey: "dasId",
  })
  declare das: BelongsTo<typeof Das>;

  @typedColumn({ type: "string" })
  declare link: string;

  @typedColumn({ type: LinkType })
  declare type: LinkType;

  @typedColumn({ type: "string", validator: vine.string().maxLength(127) })
  declare title: string;

  @typedColumn({ type: "string", optional: true })
  declare subtitle: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
