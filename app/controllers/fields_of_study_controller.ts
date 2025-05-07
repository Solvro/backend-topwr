import FieldsOfStudy from "#models/field_of_study";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class FieldsOfStudyController extends BaseController<
  typeof FieldsOfStudy
> {
  protected readonly queryRelations = ["department"];
  protected readonly crudRelations = [];
  protected readonly model = FieldsOfStudy;
}
