import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import * as relations from "@adonisjs/lucid/types/relations";

import GuideArticle from "#models/guide_article";

export default class GuideAuthor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @manyToMany(() => GuideArticle, {
    pivotTable: "guide_article_authors",
    pivotColumns: ["role"],
    pivotForeignKey: "author_id",
    pivotRelatedForeignKey: "article_id",
    relatedKey: "id",
  })
  declare guideArticles: relations.ManyToMany<typeof GuideArticle>;
}
