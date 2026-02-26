import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import DasLink from "#models/das_link";
import DasMap from "#models/das_map";
import DasStand from "#models/das_stand";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class Das extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn.dateTime({ autoCreate: false })
  declare startsAt: DateTime;

  @typedColumn.dateTime({
    autoCreate: false,
    validator: vine.luxonDateTime().afterField("startsAt"),
  })
  declare endsAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @hasMany(() => DasMap)
  declare maps: HasMany<typeof DasMap>;

  @hasMany(() => DasLink)
  declare links: HasMany<typeof DasLink>;

  @hasMany(() => DasStand)
  declare stands: HasMany<typeof DasStand>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
