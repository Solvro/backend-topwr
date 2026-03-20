import AutoCrudController from "#controllers/auto_crud_controller";
import FoodSpot from "#models/food_spot";

export default class FoodSpotsController extends AutoCrudController<
  typeof FoodSpot
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = FoodSpot;
}
