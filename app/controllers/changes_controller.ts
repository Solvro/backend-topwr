import Change from "#models/change";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class ChangesController extends BaseController<typeof Change> {
  protected readonly queryRelations = [
    "version",
    "screenshots",
    "screenshots.image",
    "version.milestone",
  ];
  protected readonly crudRelations = ["screenshots"];
  protected readonly model = Change;
}
