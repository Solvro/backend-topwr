import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

export default class AboutUsController {
  /**
   * Display a list of resource
   */
  async index() {
    const aboutUs = await AboutUsGeneral.query().first();
    const solvroSocialLinks = await AboutUsGeneralLink.all();

    return {
      data: {
        aboutUs,
        solvroSocialLinks,
      },
    };
  }
}
