import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import GuideArticle from "#models/guide_article";

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
}
