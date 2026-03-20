import AutoCrudController from "#controllers/auto_crud_controller";
import StudentOrganizationTag from "#models/student_organization_tag";

export default class StudentOrganizationTagsController extends AutoCrudController<
  typeof StudentOrganizationTag
> {
  protected readonly queryRelations = ["organizations"];
  protected readonly crudRelations = [];
  protected readonly model = StudentOrganizationTag;
}
