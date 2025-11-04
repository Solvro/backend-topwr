import StudentOrganizationTag from "#models/student_organization_tag";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class StudentOrganizationTagsController extends BaseController<
  typeof StudentOrganizationTag
> {
  protected readonly queryRelations = ["organizations"];
  protected readonly crudRelations = [];
  protected readonly model = StudentOrganizationTag;
}
