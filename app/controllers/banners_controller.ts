import Banner from "#models/banner";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class BannerController extends BaseController<typeof Banner> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = Banner;
}
