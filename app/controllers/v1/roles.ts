import AutoCrudController from "#controllers/auto_crud_controller";
import Role from "#models/role";

export default class RolesController extends AutoCrudController<typeof Role> {
  protected readonly queryRelations = [
    "contributors",
    "contributors.socialLinks",
    "contributors.milestones",
    "contributors.photo",
  ];
  protected readonly crudRelations = ["contributors"];
  protected readonly model = Role;
}
