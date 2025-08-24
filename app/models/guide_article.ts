import { MorphMap } from "@holoyan/adonisjs-permissions";
import {
  AclModelInterface,
  ModelIdType,
} from "@holoyan/adonisjs-permissions/types";
import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany } from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import { typedColumn, typedManyToMany } from "#decorators/typed_model";
import { GuideAuthorRole } from "#enums/guide_author_role";
import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";

@MorphMap("guide_articles")
export default class GuideArticle
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

  @typedColumn({ type: "number", hasDefault: true })
  declare order: number;

  @typedColumn({ foreignKeyOf: () => FileEntry })
  declare imageKey: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @typedManyToMany(() => GuideAuthor, {
    pivotTable: "guide_article_authors",
    pivotColumns: { role: { type: GuideAuthorRole } },
    pivotForeignKey: "article_id",
    pivotRelatedForeignKey: "author_id",
    relatedKey: "id",
    pivotTimestamps: true,
  })
  declare guideAuthors: ManyToMany<typeof GuideAuthor>;

  @hasMany(() => GuideQuestion, {
    foreignKey: "articleId",
  })
  declare guideQuestions: HasMany<typeof GuideQuestion>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "imageKey",
  })
  declare image: BelongsTo<typeof FileEntry>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();

  serializeExtras = true;
}
