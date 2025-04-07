import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";

import Change from "./change.js";
import FileEntry from "./file_entry.js";

export default class ChangeScreenshot extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare changeId: number;

  @typedColumn({ type: "uuid" })
  declare imageKey: string;

  @typedColumn({ type: "string", optional: true })
  declare subtitle: string | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Change)
  declare change: BelongsTo<typeof Change>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;
}
