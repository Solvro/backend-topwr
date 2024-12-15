import { BaseModel, column } from "@adonisjs/lucid/orm";

import { GuideAuthorRole } from "../enums/guide_author_role.js";

export default class GuideArticleAuthor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare articleId: number;

  @column()
  declare authorId: number;

  @column()
  declare guideAuthorRole: GuideAuthorRole;
}
