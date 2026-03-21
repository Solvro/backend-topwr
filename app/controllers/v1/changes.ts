import AutoCrudController from "#controllers/auto_crud_controller";
import Change from "#models/change";

export default class ChangesController extends AutoCrudController<
  typeof Change
> {
  protected readonly queryRelations = [
    "version",
    "screenshots",
    "screenshots.image",
    "version.milestone",
  ];
  protected readonly crudRelations = ["screenshots"];
  protected readonly model = Change;
}
