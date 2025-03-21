import { HttpContext } from "@adonisjs/core/http";

import Change from "#models/change";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class ChangesController {
  protected readonly relations = [
    "version",
    "screenshots",
    "version.milestone",
  ];
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Change.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let changes;
    if (page !== undefined) {
      changes = await baseQuery.paginate(page, limit ?? 10);
    } else {
      changes = { data: await baseQuery };
    }
    return changes;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const change = await Change.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Change with ID ${id} does not exist`);

    return { data: change };
  }
}
