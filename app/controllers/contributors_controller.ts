import Contributor from "#models/contributor";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class ContributorsController extends BaseController<
  typeof Contributor
> {
  protected readonly relations = ["roles", "milestones", "socialLinks"];
  protected readonly model = Contributor;
}
