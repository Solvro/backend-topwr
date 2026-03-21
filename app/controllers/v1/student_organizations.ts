import AutoCrudController from "#controllers/auto_crud_controller";
import StudentOrganization from "#models/student_organization";

export default class StudentOrganizationsController extends AutoCrudController<
  typeof StudentOrganization
> {
  protected readonly queryRelations = [
    "tags",
    "links",
    "logo",
    "cover",
    "department",
  ];
  protected readonly crudRelations = ["tags", "links"];
  protected readonly model = StudentOrganization;
}
