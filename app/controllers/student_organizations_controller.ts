import StudentOrganization from "#models/student_organization";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class StudentOrganizationsController extends BaseController<
  typeof StudentOrganization
> {
  protected readonly queryRelations = ["tags", "links", "logo", "cover"];
  protected readonly crudRelations = ["tags", "links"];
  protected readonly model = StudentOrganization;
}
