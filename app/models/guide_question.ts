import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import GuideArticle from "#models/guide_article";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

@typedModel({
  id: "number",
  title: "string",
  answer: "string",
  articleId: "number",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class GuideQuestion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare title: string;

  @column()
  declare answer: string;

  @column()
  declare articleId: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => GuideArticle)
  declare guideArticle: relations.BelongsTo<typeof GuideArticle>;

  static preloadRelations = preloadRelations(GuideQuestion);

  static handleSearchQuery = handleSearchQuery(GuideQuestion);

  static handleSortQuery = handleSortQuery(GuideQuestion);
}
