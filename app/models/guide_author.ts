import { DateTime } from "luxon";

import { BaseModel } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import { typedColumn, typedManyToMany } from "#decorators/typed_model";
import { GuideAuthorRole } from "#enums/guide_author_role";
import GuideArticle from "#models/guide_article";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class GuideAuthor extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @typedManyToMany(() => GuideArticle, {
    pivotTable: "guide_article_authors",
    pivotColumns: { role: { type: GuideAuthorRole } },
    pivotForeignKey: "author_id",
    pivotRelatedForeignKey: "article_id",
    relatedKey: "id",
    pivotTimestamps: true,
  })
  declare guideArticles: ManyToMany<typeof GuideArticle>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
