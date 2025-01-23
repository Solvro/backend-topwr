import type { HttpContext } from "@adonisjs/core/http";

import Library from "#models/library";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class LibrariesController {
  protected readonly relations = ["regularHours", "specialHours", "building"];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Library.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let libraries;
    if (page !== undefined) {
      libraries = await baseQuery.paginate(page, limit ?? 10);
    } else {
      libraries = { data: await baseQuery };
    }
    return libraries;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const library = await Library.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail();

    return { data: library };
  }
}
