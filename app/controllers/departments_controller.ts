import Department from "#models/department";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DepartmentsController extends BaseController<
  typeof Department
> {
  protected readonly queryRelations = [
    "departmentLinks",
    "fieldsOfStudy",
    "logo",
  ];
  protected readonly crudRelations = ["departmentLinks", "fieldsOfStudy"];
  protected readonly model = Department;
}
