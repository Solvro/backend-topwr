import type { HttpContext } from "@adonisjs/core/http";

import Campus from "#models/campus";
import { showValidator } from "#validators/show";

export default class CampusesController {
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const campuses = await Campus.query().withScopes((scopes) => {
      scopes.handleSearchQuery(
        request.only(["id", "name", "createdAt", "updatedAt"]),
      );
      scopes.preloadRelations(request.only(["buildings"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    return { data: campuses };
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const campus = await Campus.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["buildings"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: campus };
  }
}
