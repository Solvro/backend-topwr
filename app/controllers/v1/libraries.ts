import AutoCrudController from "#controllers/auto_crud_controller";
import Library from "#models/library";

export default class LibrariesController extends AutoCrudController<
  typeof Library
> {
  protected readonly queryRelations = [
    "regularHours",
    "specialHours",
    "building",
    "photo",
    "building.cover",
  ];
  protected readonly crudRelations = ["regularHours", "specialHours"];
  protected readonly model = Library;
}
