import AutoCrudController from "#controllers/auto_crud_controller";
import VersionScreenshot from "#models/version_screenshot";

export default class VersionScreenshotsController extends AutoCrudController<
  typeof VersionScreenshot
> {
  protected readonly queryRelations = ["image", "version"];
  protected readonly crudRelations = [];
  protected readonly model = VersionScreenshot;
}
