import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";

import { typedColumn } from "#decorators/typed_model";
import { LinkType } from "#enums/link_type";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class AboutUsGeneralLink extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: LinkType })
  declare linkType: LinkType;

  @typedColumn({ type: "string" })
  declare link: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
