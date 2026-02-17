import DasStand from "#models/das_stand";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class DasStandsController extends BaseController<
  typeof DasStand
> {
  protected readonly queryRelations = ["das", "logo"];
  protected readonly crudRelations = [];
  protected readonly model = DasStand;
}
