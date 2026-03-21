import AutoCrudController from "#controllers/auto_crud_controller";
import GuideAuthor from "#models/guide_author";

export default class GuideAuthorsController extends AutoCrudController<
  typeof GuideAuthor
> {
  protected readonly queryRelations = ["guideArticles"];
  protected readonly crudRelations = ["guideArticles"];
  protected readonly model = GuideAuthor;
}
