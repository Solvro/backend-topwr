import Role from "#models/role";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class RolesController extends BaseController<typeof Role> {
  protected readonly relations = [
    "contributors",
    "contributors.socialLinks",
    "contributors.milestones",
  ];
  protected readonly model = Role;
}
