import Aed from "#models/aed";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class AedsController extends BaseController<typeof Aed> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = Aed;
}
