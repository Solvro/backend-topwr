import DasMap from "#models/das_map";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasMapsController extends BaseController<typeof DasMap> {
  protected readonly queryRelations = ["das", "content"];
  protected readonly crudRelations = [];
  protected readonly model = DasMap;
}
