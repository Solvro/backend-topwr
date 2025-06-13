import Polinka from "#models/polinka";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class PolinkasController extends BaseController<typeof Polinka> {
  protected readonly queryRelations = ["photo", "campus"];
  protected readonly crudRelations = [];
  protected readonly model = Polinka;
}
