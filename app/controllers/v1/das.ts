import Das from "#models/das";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasController extends BaseController<typeof Das> {
  protected readonly queryRelations = [
    "maps",
    "maps.content",
    "links",
    "stands",
    "stands.logo",
  ];
  protected readonly crudRelations = ["maps", "links", "stands"];
  protected readonly model = Das;
}
