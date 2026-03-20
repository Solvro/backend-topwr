import AutoCrudController from "#controllers/auto_crud_controller";
import DasStand from "#models/das_stand";

export default class DasStandsController extends AutoCrudController<
  typeof DasStand
> {
  protected readonly queryRelations = ["das", "logo"];
  protected readonly crudRelations = [];
  protected readonly model = DasStand;
}
