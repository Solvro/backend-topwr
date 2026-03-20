import AutoCrudController from "#controllers/auto_crud_controller";
import Department from "#models/department";

export default class DepartmentsController extends AutoCrudController<
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
