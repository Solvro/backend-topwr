import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";

import FileEntry from "./file_entry.js";
import Version from "./version.js";

export default class VersionScreenshot extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare versionId: number;

  @typedColumn({ type: "uuid" })
  declare imageKey: string;

  @typedColumn({ type: "string", optional: true })
  declare subtitle: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Version)
  declare change: BelongsTo<typeof Version>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;
}
