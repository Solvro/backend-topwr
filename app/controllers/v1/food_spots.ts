import FoodSpot from "#models/food_spot";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class FoodSpotsController extends BaseController<
  typeof FoodSpot
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = FoodSpot;
}
