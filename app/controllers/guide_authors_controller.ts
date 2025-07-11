import GuideAuthor from "#models/guide_author";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideAuthorsController extends BaseController<
  typeof GuideAuthor
> {
  protected readonly queryRelations = ["guideArticles"];
  protected readonly crudRelations = ["guideArticles"];
  protected readonly model = GuideAuthor;
}
