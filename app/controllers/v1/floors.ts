import AutoCrudController from "#controllers/auto_crud_controller";
import Floor from "#models/floor";

export default class FloorsController extends AutoCrudController<typeof Floor> {
  protected readonly queryRelations = ["stands"];
  protected readonly crudRelations = ["stands"];
  protected readonly model = Floor;
}
