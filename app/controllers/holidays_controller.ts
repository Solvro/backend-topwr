import Holiday from "#models/holiday";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class HolidaysController extends BaseController<typeof Holiday> {
  protected readonly relations = ["academicCalendar"];
  protected readonly model = Holiday;
}
