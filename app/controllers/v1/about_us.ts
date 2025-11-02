import BaseController from "#controllers/base_controller";
import { aboutUsLinkTypeOrder, compareLinkTypes } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

export default class AboutUsController extends BaseController<
  typeof AboutUsGeneral
> {
  protected queryRelations = [];
  protected crudRelations = [];
  protected model = AboutUsGeneral;
  protected singletonId = 1;

  /**
   * show method override kept to not break compatibility
   */
  async show() {
    const aboutUs = await AboutUsGeneral.query()
      .where("id", 1)
      .orderBy("created_at", "asc")
      .preload("coverPhoto")
      .firstOrFail()
      .addErrorContext("No about us data found in database");
    const solvroSocialLinks = await AboutUsGeneralLink.all();
    return {
      data: {
        aboutUs,
        solvroSocialLinks: solvroSocialLinks.sort((a, b) =>
          compareLinkTypes(a.linkType, b.linkType, aboutUsLinkTypeOrder),
        ),
      },
    };
  }
}
