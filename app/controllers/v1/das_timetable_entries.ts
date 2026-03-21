import AutoCrudController from "#controllers/auto_crud_controller";
import DasTimetableEntry from "#models/das_timetable_entry";

export default class DasTimetableEntriesController extends AutoCrudController<
  typeof DasTimetableEntry
> {
  protected readonly queryRelations = ["timetable"];
  protected readonly crudRelations = [];
  protected readonly model = DasTimetableEntry;
}
