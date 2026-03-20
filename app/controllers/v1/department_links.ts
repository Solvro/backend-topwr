import AutoCrudController from "#controllers/auto_crud_controller";
import DepartmentLink from "#models/department_link";

export default class DepartmentLinksController extends AutoCrudController<
  typeof DepartmentLink
> {
  protected readonly queryRelations = ["department"];
  protected readonly crudRelations = [];
  protected readonly model = DepartmentLink;
}
