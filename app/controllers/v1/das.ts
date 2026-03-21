import AutoCrudController from "#controllers/auto_crud_controller";
import Das from "#models/das";

export default class DasController extends AutoCrudController<typeof Das> {
  protected readonly queryRelations = [
    "maps",
    "maps.content",
    "links",
    "stands",
    "stands.logo",
    "timetable",
  ];
  protected readonly crudRelations = ["maps", "links", "stands", "timetable"];
  protected readonly model = Das;
}
