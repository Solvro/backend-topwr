import Version from "#models/version";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class VersionsController extends BaseController<typeof Version> {
  protected readonly relations = [
    "screenshots",
    "screenshots.image",
    "changes",
    "changes.screenshots",
    "changes.screenshots.image",
    "milestone",
  ];
  protected readonly model = Version;
}
