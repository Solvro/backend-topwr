import Library from "#models/library";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class LibrariesController extends BaseController<
  typeof Library
> {
  protected readonly relations = ["regularHours", "specialHours", "building"];
  protected readonly model = Library;
}
