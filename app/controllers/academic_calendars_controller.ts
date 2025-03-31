import AcademicCalendar from "#models/academic_calendar";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class AcademicCalendarsController extends BaseController<
  typeof AcademicCalendar
> {
  protected readonly relations = ["holidays", "daySwaps"];
  protected readonly model = AcademicCalendar;
}
