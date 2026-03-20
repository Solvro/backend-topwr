import AutoCrudController from "#controllers/auto_crud_controller";
import Milestone from "#models/milestone";

export default class MilestonesController extends AutoCrudController<
  typeof Milestone
> {
  protected readonly queryRelations = [
    "contributors",
    "contributors.socialLinks",
    "versions",
    "versions.screenshots",
    "versions.screenshots.image",
    "versions.changes",
    "versions.changes.screenshots",
    "versions.changes.screenshots.image",
  ];
  protected readonly crudRelations = ["contributors", "versions"];
  protected readonly model = Milestone;
}
