import AboutUsGeneralLink from "#models/about_us_general_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class AboutUsLinksController extends BaseController<
  typeof AboutUsGeneralLink
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = AboutUsGeneralLink;
}
