import GuideAuthor from "#models/guide_author";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideAuthorsController extends BaseController<
  typeof GuideAuthor
> {
  protected readonly relations = ["guideArticles"];
  protected readonly model = GuideAuthor;
}
