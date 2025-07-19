import Polinka from "#models/polinka_station";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class PolinkaStationsController extends BaseController<
  typeof Polinka
> {
  protected readonly queryRelations = ["photo", "campus"];
  protected readonly crudRelations = [];
  protected readonly model = Polinka;
}
