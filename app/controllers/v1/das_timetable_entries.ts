import DasTimetableEntry from "#models/das_timetable_entry";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasTimetableEntriesController extends BaseController<
  typeof DasTimetableEntry
> {
  protected readonly queryRelations = ["timetable"];
  protected readonly crudRelations = [];
  protected readonly model = DasTimetableEntry;
}
