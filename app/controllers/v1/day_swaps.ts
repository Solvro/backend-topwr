import AutoCrudController from "#controllers/auto_crud_controller";
import DaySwap from "#models/day_swap";

export default class DaySwapsController extends AutoCrudController<
  typeof DaySwap
> {
  protected readonly queryRelations = ["academicCalendar"];
  protected readonly crudRelations = [];
  protected readonly model = DaySwap;
}
