import Milestone from "#models/milestone";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class MilestonesController extends BaseController<
  typeof Milestone
> {
  protected readonly relations = [
    "contributors",
    "contributors.socialLinks",
    "versions",
    "versions.screenshots",
    "versions.changes",
    "versions.changes.screenshots",
  ];
  protected readonly model = Milestone;
}
