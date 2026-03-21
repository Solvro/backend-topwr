import AutoCrudController from "#controllers/auto_crud_controller";
import StudentOrganizationLink from "#models/student_organization_link";

export default class StudentOrganizationLinksController extends AutoCrudController<
  typeof StudentOrganizationLink
> {
  protected readonly queryRelations = ["organization"];
  protected readonly crudRelations = [];
  protected readonly model = StudentOrganizationLink;
}
