import AutoCrudController from "#controllers/auto_crud_controller";
import GuideArticle from "#models/guide_article";

export default class GuideArticlesController extends AutoCrudController<
  typeof GuideArticle
> {
  protected readonly queryRelations = [
    "guideAuthors",
    "guideQuestions",
    "image",
  ];
  protected readonly crudRelations = ["guideAuthors", "guideQuestions"];
  protected readonly model = GuideArticle;
}
