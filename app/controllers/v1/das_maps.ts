import AutoCrudController from "#controllers/auto_crud_controller";
import DasMap from "#models/das_map";

export default class DasMapsController extends AutoCrudController<
  typeof DasMap
> {
  protected readonly queryRelations = ["das", "content"];
  protected readonly crudRelations = [];
  protected readonly model = DasMap;
}
