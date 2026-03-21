import AutoCrudController from "#controllers/auto_crud_controller";
import Polinka from "#models/polinka_station";

export default class PolinkaStationsController extends AutoCrudController<
  typeof Polinka
> {
  protected readonly queryRelations = ["photo", "campus"];
  protected readonly crudRelations = [];
  protected readonly model = Polinka;
}
