import DepartmentsLink from "#models/department_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DepartmentLinksController extends BaseController<
  typeof DepartmentsLink
> {
  protected readonly queryRelations = ["department"];
  protected readonly crudRelations = [];
  protected readonly model = DepartmentsLink;
}
