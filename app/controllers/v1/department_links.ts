import DepartmentLink from "#models/department_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DepartmentLinksController extends BaseController<
  typeof DepartmentLink
> {
  protected readonly queryRelations = ["department"];
  protected readonly crudRelations = [];
  protected readonly model = DepartmentLink;
}
