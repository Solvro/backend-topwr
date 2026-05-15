import AutoCrudController from "#controllers/auto_crud_controller";
import User from "#models/user";

export default class UsersController extends AutoCrudController<typeof User> {
  protected readonly queryRelations = ["userRoles", "userPermissions"];
  protected readonly crudRelations = [];
  protected readonly model = User;
}
