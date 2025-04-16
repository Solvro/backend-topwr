import Library from "#models/library";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class LibrariesController extends BaseController<
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
