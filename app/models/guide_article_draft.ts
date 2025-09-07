import { MorphMap } from "@holoyan/adonisjs-permissions";
import {
  AclModelInterface,
  ModelIdType,
} from "@holoyan/adonisjs-permissions/types";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import GuideArticle from "#models/guide_article";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";

@MorphMap("guide_article_drafts")
export default class GuideArticleDraft
  extends BaseModel
  implements AclModelInterface
{
  getModelId(): ModelIdType {
    return this.id;
  }

  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare title: string;

  @typedColumn({ type: "string" })
  declare shortDesc: string;

  @typedColumn({ type: "string" })
  declare description: string;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare imageKey: string | null;

  // Link to original published article
  @typedColumn({ foreignKeyOf: () => GuideArticle, optional: true })
  declare originalArticleId: number | null;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;

  @belongsTo(() => GuideArticle, {
    localKey: "id",
    foreignKey: "originalArticleId",
  })
  declare originalArticle: BelongsTo<typeof GuideArticle>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
