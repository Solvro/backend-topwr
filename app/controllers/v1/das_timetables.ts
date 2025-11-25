import DasTimetable from "#models/das_timetable";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasTimetableController extends BaseController<
  typeof DasTimetable
> {
  protected readonly queryRelations = ["das", "entries"];
  protected readonly crudRelations = ["entries"];
  protected readonly model = DasTimetable;
}
