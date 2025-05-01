import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import GuideArticle from "#models/guide_article";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class GuideQuestion extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare title: string;

  @typedColumn({ type: "string" })
  declare answer: string;

  @typedColumn({ type: "integer" })
  declare articleId: number;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => GuideArticle, {
    foreignKey: "articleId",
  })
  declare guideArticle: relations.BelongsTo<typeof GuideArticle>;

  public static getGuideArticleRelationKey() {
    return "articleId";
  }

  static preloadRelations = preloadRelations(GuideQuestion);

  static handleSearchQuery = handleSearchQuery(GuideQuestion);

  static handleSortQuery = handleSortQuery(GuideQuestion);
}
