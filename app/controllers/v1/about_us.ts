import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { aboutUsLinkTypeOrder, compareLinkTypes } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";

export default class AboutUsController {
  $configureRoutes(controller: LazyImport<Constructor<AboutUsController>>) {
    router.get("/", [controller, "show"]).as("show");
  }

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
