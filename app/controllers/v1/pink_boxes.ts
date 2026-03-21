import AutoCrudController from "#controllers/auto_crud_controller";
import PinkBox from "#models/pink_box";

export default class PinkBoxesController extends AutoCrudController<
  typeof PinkBox
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = PinkBox;
}
