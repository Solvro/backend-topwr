import DaySwap from "#models/day_swap";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DaySwapsController extends BaseController<typeof DaySwap> {
  protected readonly queryRelations = ["academicCalendar"];
  protected readonly crudRelations = [];
  protected readonly model = DaySwap;
}
