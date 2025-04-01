import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { BuildingIcon } from "#enums/building_icon";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Aed from "./aed.js";
import BicycleShower from "./bicycle_shower.js";
import Campus from "./campus.js";
import FoodSpot from "./food_spot.js";
import Library from "./library.js";

@typedModel({
  id: "number",
  identifier: "string",
  specialName: "string",
  iconType: BuildingIcon,
  campusId: "number",
  addressLine1: "string",
  addressLine2: "string",
  latitude: "number",
  longitude: "number",
  haveFood: "boolean",
  coverKey: "string",
  externalDigitalGuideMode: "string",
  externalDigitalGuideIdOrUrl: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Building extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare identifier: string;

  @column()
  declare specialName: string | null;

  @column()
  declare iconType: BuildingIcon;

  @column()
  declare campusId: number;

  @column({ columnName: "address_line1" })
  declare addressLine1: string;

  @column({ columnName: "address_line2" })
  declare addressLine2: string | null;

  @column()
  declare latitude: number;

  @column()
  declare longitude: number;

  @column()
  declare haveFood: boolean;

  @column()
  declare coverKey: string | null;

  @column()
  declare externalDigitalGuideMode: string | null;

  @column()
  declare externalDigitalGuideIdOrUrl: string | null;

  @belongsTo(() => Campus)
  declare campus: BelongsTo<typeof Campus>;

  @hasMany(() => Aed)
  declare aeds: HasMany<typeof Aed>;

  @hasMany(() => BicycleShower)
  declare bicycleShowers: HasMany<typeof BicycleShower>;

  @hasMany(() => FoodSpot)
  declare foodSpots: HasMany<typeof FoodSpot>;

  @hasMany(() => Library)
  declare libraries: HasMany<typeof Library>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations(Building);

  static handleSearchQuery = handleSearchQuery(Building);

  static handleSortQuery = handleSortQuery(Building);
}
