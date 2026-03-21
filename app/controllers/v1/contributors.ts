import AutoCrudController from "#controllers/auto_crud_controller";
import Contributor from "#models/contributor";

export default class ContributorsController extends AutoCrudController<
  typeof Contributor
> {
  protected readonly queryRelations = [
    "roles",
    "milestones",
    "socialLinks",
    "photo",
  ];
  protected readonly crudRelations = ["roles", "milestones", "socialLinks"];
  protected readonly model = Contributor;
}
