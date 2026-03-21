import AutoCrudController from "#controllers/auto_crud_controller";
import GuideQuestion from "#models/guide_question";

export default class GuideQuestionsController extends AutoCrudController<
  typeof GuideQuestion
> {
  protected readonly queryRelations = ["guideArticle"];
  protected readonly crudRelations = [];
  protected readonly model = GuideQuestion;
}
