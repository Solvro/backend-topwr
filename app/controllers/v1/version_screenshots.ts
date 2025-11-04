import VersionScreenshot from "#models/version_screenshot";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class VersionScreenshotsController extends BaseController<
  typeof VersionScreenshot
> {
  protected readonly queryRelations = ["image", "version"];
  protected readonly crudRelations = [];
  protected readonly model = VersionScreenshot;
}
