import BaseController from "#controllers/base_controller";
import AboutUsGeneral from "#models/about_us_general";

export default class AboutUsController extends BaseController<
  typeof AboutUsGeneral
> {
  protected queryRelations = [];
  protected crudRelations = [];
  protected model = AboutUsGeneral;
  protected singletonId = 1;
}
