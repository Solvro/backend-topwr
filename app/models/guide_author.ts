import { DateTime } from "luxon";

import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import GuideArticle from "#models/guide_article";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

@typedModel({
  id: "number",
  name: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class GuideAuthor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => GuideArticle, {
    pivotTable: "guide_article_authors",
    pivotColumns: ["role"],
    pivotForeignKey: "author_id",
    pivotRelatedForeignKey: "article_id",
    relatedKey: "id",
    pivotTimestamps: true,
  })
  declare guideArticles: relations.ManyToMany<typeof GuideArticle>;

  static preloadRelations = preloadRelations(GuideAuthor);

  static handleSearchQuery = handleSearchQuery(GuideAuthor);

  static handleSortQuery = handleSortQuery(GuideAuthor);
}
