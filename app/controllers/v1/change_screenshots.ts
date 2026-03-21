import AutoCrudController from "#controllers/auto_crud_controller";
import ChangeScreenshot from "#models/change_screenshot";

export default class ChangeScreenshotsController extends AutoCrudController<
  typeof ChangeScreenshot
> {
  protected readonly queryRelations = ["image", "change", "change.version"];
  protected readonly crudRelations = [];
  protected readonly model = ChangeScreenshot;
}
