import AutoCrudController from "#controllers/auto_crud_controller";
import DasTimetable from "#models/das_timetable";

export default class DasTimetableController extends AutoCrudController<
  typeof DasTimetable
> {
  protected readonly queryRelations = ["das", "entries"];
  protected readonly crudRelations = ["entries"];
  protected readonly model = DasTimetable;
}
