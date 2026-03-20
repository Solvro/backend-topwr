import AutoCrudController from "#controllers/auto_crud_controller";
import RegularHour from "#models/regular_hour";

export default class RegularHoursController extends AutoCrudController<
  typeof RegularHour
> {
  protected readonly queryRelations = ["library"];
  protected readonly crudRelations = [];
  protected readonly model = RegularHour;
}
