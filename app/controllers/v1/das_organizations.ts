import AutoCrudController from "#controllers/auto_crud_controller";
import DasOrganization from "#models/das_organization";

export default class DasController extends AutoCrudController<
  typeof DasOrganization
> {
  protected readonly queryRelations = ["studentOrganization", "logo"];
  protected readonly crudRelations = [];
  protected readonly model = DasOrganization;
}
