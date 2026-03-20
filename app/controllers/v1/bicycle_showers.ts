import AutoCrudController from "#controllers/auto_crud_controller";
import BicycleShower from "#models/bicycle_shower";

export default class BicycleShowersController extends AutoCrudController<
  typeof BicycleShower
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = BicycleShower;
}
