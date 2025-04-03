import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";

import FileEntry from "./file_entry.js";

@typedModel({
  id: "number",
  description: "string",
  coverPhotoKey: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class AboutUsGeneral extends BaseModel {
  public static table = "about_us_general";

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare description: string;

  @column()
  declare coverPhotoKey: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "coverPhotoKey",
  })
  declare coverPhoto: BelongsTo<typeof FileEntry>;
}
