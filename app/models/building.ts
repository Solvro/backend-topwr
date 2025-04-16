import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { BuildingIcon } from "#enums/building_icon";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Aed from "./aed.js";
import BicycleShower from "./bicycle_shower.js";
import Campus from "./campus.js";
import FileEntry from "./file_entry.js";
import FoodSpot from "./food_spot.js";
import Library from "./library.js";

export default class Building extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare identifier: string;

  @typedColumn({ type: "string", optional: true })
  declare specialName: string | null;

  @typedColumn({ type: BuildingIcon })
  declare iconType: BuildingIcon;

  @typedColumn({ type: "integer" })
  declare campusId: number;

  @typedColumn({ type: "string", columnName: "address_line1" })
  declare addressLine1: string;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ type: "number" })
  declare latitude: number;

  @typedColumn({ type: "number" })
  declare longitude: number;

  @typedColumn({ type: "boolean" })
  declare haveFood: boolean;

  @typedColumn({ type: "uuid", optional: true })
  declare coverKey: string | null;

  @typedColumn({ type: ExternalDigitalGuideMode, optional: true })
  declare externalDigitalGuideMode: ExternalDigitalGuideMode | null;

  @typedColumn({ type: "string", optional: true })
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

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "coverKey",
  })
  declare cover: BelongsTo<typeof FileEntry>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
