import Change from "#models/change";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class ChangesController extends BaseController<typeof Change> {
  protected readonly relations = [
    "version",
    "screenshots",
    "screenshots.image",
    "version.milestone",
  ];
  protected readonly model = Change;
}
