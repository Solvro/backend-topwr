import { aboutUsLinkTypeOrder, compareLinkTypes } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

export default class AboutUsController {
  /**
   * Display a list of resource
   */
  async index() {
    const aboutUs = await AboutUsGeneral.query()
      .orderBy("created_at", "asc")
      .preload("coverPhoto")
      .first();
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
