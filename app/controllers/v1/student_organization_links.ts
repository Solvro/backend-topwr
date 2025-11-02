import StudentOrganizationLink from "#models/student_organization_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class StudentOrganizationLinksController extends BaseController<
  typeof StudentOrganizationLink
> {
  protected readonly queryRelations = ["organization"];
  protected readonly crudRelations = [];
  protected readonly model = StudentOrganizationLink;
}
