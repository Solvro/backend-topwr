import GuideQuestion from "#models/guide_question";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideQuestionsController extends BaseController<
  typeof GuideQuestion
> {
  protected readonly relations = ["guideArticle"];
  protected readonly model = GuideQuestion;
}
