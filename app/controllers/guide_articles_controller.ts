import GuideArticle from "#models/guide_article";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideArticlesController extends BaseController<
  typeof GuideArticle
> {
  protected readonly relations = ["guideAuthors", "guideQuestions", "image"];
  protected readonly model = GuideArticle;
}
