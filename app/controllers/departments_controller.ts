import Department from "#models/department";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DepartmentsController extends BaseController<
  typeof Department
> {
  protected readonly relations = ["fieldOfStudy", "departmentLink", "logo"];
  protected readonly model = Department;
}
