import AutoCrudController from "#controllers/auto_crud_controller";
import AboutUsGeneral from "#models/about_us_general";

export default class AboutUsController extends AutoCrudController<
  typeof AboutUsGeneral
> {
  protected queryRelations = ["coverPhoto"];
  protected crudRelations = [];
  protected model = AboutUsGeneral;
  protected singletonId = 1;
}
