import AutoCrudController from "#controllers/auto_crud_controller";
import Aed from "#models/aed";

export default class AedsController extends AutoCrudController<typeof Aed> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = Aed;
}
