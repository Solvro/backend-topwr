import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import FileEntry from "./file_entry.js";
import Version from "./version.js";

export default class VersionScreenshot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare versionId: number;

  @column()
  declare imageKey: string;

  @column()
  declare subtitle: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Version)
  declare change: BelongsTo<typeof Version>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;
}
