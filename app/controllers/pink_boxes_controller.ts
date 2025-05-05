import PinkBox from "#models/pink_box";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class PinkBoxesController extends BaseController<
  typeof PinkBox
> {
  protected readonly queryRelations = ["building", "photo"];
  protected readonly crudRelations = [];
  protected readonly model = PinkBox;
}
