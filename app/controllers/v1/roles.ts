import Role from "#models/role";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class RolesController extends BaseController<typeof Role> {
  protected readonly queryRelations = [
    "contributors",
    "contributors.socialLinks",
    "contributors.milestones",
    "contributors.photo",
  ];
  protected readonly crudRelations = ["contributors"];
  protected readonly model = Role;
}
