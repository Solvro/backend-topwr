import { ModelAttributes } from "@adonisjs/lucid/types/model";

import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";

import { GenericDraftController } from "./drafts.js";

export default class GuideArticleDraftsController extends GenericDraftController<
  typeof GuideArticle,
  typeof GuideArticleDraft,
  ModelAttributes<GuideArticle>,
  ModelAttributes<GuideArticleDraft> & { order: number }
> {
  protected readonly queryRelations = ["image", "original", "createdBy"];
  protected readonly model = GuideArticleDraft;
  protected readonly approvedModel = GuideArticle;
}
