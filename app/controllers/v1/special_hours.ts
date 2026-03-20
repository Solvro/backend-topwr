import AutoCrudController from "#controllers/auto_crud_controller";
import SpecialHour from "#models/special_hour";

export default class SpecialHoursController extends AutoCrudController<
  typeof SpecialHour
> {
  protected readonly queryRelations = ["library"];
  protected readonly crudRelations = [];
  protected readonly model = SpecialHour;
}
