import GuideArticle from "#models/guide_article";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideArticlesController extends BaseController<
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
