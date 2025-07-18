import Milestone from "#models/milestone";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class MilestonesController extends BaseController<
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
