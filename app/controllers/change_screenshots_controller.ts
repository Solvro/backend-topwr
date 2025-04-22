import ChangeScreenshot from "#models/change_screenshot";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class ChangeScreenshotsController extends BaseController<
  typeof ChangeScreenshot
> {
  protected readonly queryRelations = ["image", "change", "change.version"];
  protected readonly crudRelations = [];
  protected readonly model = ChangeScreenshot;
}
