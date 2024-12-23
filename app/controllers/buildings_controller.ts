import { HttpContext } from "@adonisjs/core/http";

import Building from "#models/building";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class BuildingsController {
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Building.query().withScopes((scopes) => {
      scopes.handleSearchQuery(
        request.only([
          "id",
          "identifier",
          "specialName",
          "campusId",
          "addressLine1",
          "addressLine2",
          "latitude",
          "longitude",
          "haveFood",
          "createdAt",
          "updatedAt",
        ]),
      );
      scopes.preloadRelations(request.only(["campus"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    let buildings;
    if (page !== undefined) {
      buildings = await baseQuery.paginate(page, limit ?? 10);
    } else {
      buildings = { data: await baseQuery };
    }
    return buildings;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const building = await Building.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["campus"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: building };
  }
}
