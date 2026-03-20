import AutoCrudController from "#controllers/auto_crud_controller";
import AcademicCalendar from "#models/academic_calendar";

export default class AcademicCalendarsController extends AutoCrudController<
  typeof AcademicCalendar
> {
  protected readonly queryRelations = ["holidays", "daySwaps"];
  protected readonly crudRelations = ["holidays", "daySwaps"];
  protected readonly model = AcademicCalendar;
}
