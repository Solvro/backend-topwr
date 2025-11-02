import Holiday from "#models/holiday";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class HolidaysController extends BaseController<typeof Holiday> {
  protected readonly queryRelations = ["academicCalendar"];
  protected readonly crudRelations = [];
  protected readonly model = Holiday;
}
