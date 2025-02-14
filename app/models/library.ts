import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Building from "./building.js";
import RegularHour from "./regular_hour.js";
import SpecialHour from "./special_hour.js";
import { typedModel } from "#decorators/typed_model";

@typedModel({
  id: "number",
  title: "string",
  room: "string",
  addressLine1: "string",
  addressLine2: "string",
  phone: "string",
  email: "string",
  latitude: "number",
  longitude: "number",
  photoUrl: "string",
  buildingId: "number",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Library extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare title: string;

  @column()
  declare room: string | null;

  @column({ columnName: "address_line1" })
  declare addressLine1: string | null;

  @column({ columnName: "address_line2" })
  declare addressLine2: string | null;

  @column()
  declare phone: string | null;

  @column()
  declare email: string | null;

  @column()
  declare latitude: number;

  @column()
  declare longitude: number;

  @column()
  declare photoUrl: string | null;

  @column()
  declare buildingId: number | null;

  @belongsTo(() => Building)
  declare building: BelongsTo<typeof Building>;

  @hasMany(() => RegularHour)
  declare regularHours: HasMany<typeof RegularHour>;

  @hasMany(() => SpecialHour)
  declare specialHours: HasMany<typeof SpecialHour>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations(Library);
  static handleSearchQuery = handleSearchQuery(Library);
  static handleSortQuery = handleSortQuery(Library);
}
