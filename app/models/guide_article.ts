import { DateTime } from "luxon";

import { BaseModel, column, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import GuideAuthor from "#models/guide_author";
import GuideQuestion from "#models/guide_question";

export default class GuideArticle extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare title: string;

  @column()
  declare shortDesc: string;

  @column()
  declare description: string;

  @column()
  declare imagePath: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @manyToMany(() => GuideAuthor, {
    pivotTable: "guide_article_authors",
    pivotColumns: ["role"],
    pivotForeignKey: "article_id",
    pivotRelatedForeignKey: "author_id",
    relatedKey: "id",
    pivotTimestamps: true,
  })
  declare guideAuthors: relations.ManyToMany<typeof GuideAuthor>;

  @hasMany(() => GuideQuestion)
  declare guideQuestions: relations.HasMany<typeof GuideQuestion>;
}
