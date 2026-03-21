import AutoCrudController from "#controllers/auto_crud_controller";
import SksOpeningHours from "#models/sks_opening_hours";

export default class SksOpeningHoursController extends AutoCrudController<
  typeof SksOpeningHours
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = SksOpeningHours;
}
