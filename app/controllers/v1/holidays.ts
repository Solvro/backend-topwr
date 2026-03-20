import AutoCrudController from "#controllers/auto_crud_controller";
import Holiday from "#models/holiday";

export default class HolidaysController extends AutoCrudController<
  typeof Holiday
> {
  protected readonly queryRelations = ["academicCalendar"];
  protected readonly crudRelations = [];
  protected readonly model = Holiday;
}
