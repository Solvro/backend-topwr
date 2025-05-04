import BicycleShower from "#models/bicycle_shower";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class BicycleShowersController extends BaseController<
  typeof BicycleShower
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = BicycleShower;
}
