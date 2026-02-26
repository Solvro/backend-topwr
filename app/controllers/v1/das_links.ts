import DasLink from "#models/das_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasLinkController extends BaseController<typeof DasLink> {
  protected readonly queryRelations = ["das"];
  protected readonly crudRelations = [];
  protected readonly model = DasLink;
}
