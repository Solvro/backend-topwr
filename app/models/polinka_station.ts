import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import Campus from "./campus.js";
import FileEntry from "./file_entry.js";

export default class PolinkaStation extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ foreignKeyOf: () => Campus })
  declare campusId: number;

  @typedColumn({ type: "string", columnName: "address_line1" })
  declare addressLine1: string;

  @typedColumn({ type: "string", optional: true, columnName: "address_line2" })
  declare addressLine2: string | null;

  @typedColumn({ type: "number", validator: vine.number().min(-90).max(90) })
  declare latitude: number;

  @typedColumn({ type: "number", validator: vine.number().min(-180).max(180) })
  declare longitude: number;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare photoKey: string | null;

  @typedColumn({ type: ExternalDigitalGuideMode, optional: true })
  declare externalDigitalGuideMode: ExternalDigitalGuideMode | null;

  @typedColumn({ type: "string", optional: true })
  declare externalDigitalGuideIdOrUrl: string | null;

  @belongsTo(() => Campus)
  declare campus: BelongsTo<typeof Campus>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "photoKey",
  })
  declare photo: BelongsTo<typeof FileEntry>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
