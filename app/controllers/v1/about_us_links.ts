import AutoCrudController from "#controllers/auto_crud_controller";
import AboutUsGeneralLink from "#models/about_us_general_link";

export default class AboutUsLinksController extends AutoCrudController<
  typeof AboutUsGeneralLink
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = AboutUsGeneralLink;
}
