import AutoCrudController from "#controllers/auto_crud_controller";
import DasLink from "#models/das_link";

export default class DasLinkController extends AutoCrudController<
  typeof DasLink
> {
  protected readonly queryRelations = ["das"];
  protected readonly crudRelations = [];
  protected readonly model = DasLink;
}
