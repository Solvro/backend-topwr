import AutoCrudController from "#controllers/auto_crud_controller";
import FieldsOfStudy from "#models/field_of_study";

export default class FieldsOfStudyController extends AutoCrudController<
  typeof FieldsOfStudy
> {
  protected readonly queryRelations = ["department"];
  protected readonly crudRelations = [];
  protected readonly model = FieldsOfStudy;
}
