import { HttpContext } from "@adonisjs/core/http";

import Version from "#models/version";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class VersionsController {
  protected readonly relations = [
    "screenshots",
    "changes",
    "changes.screenshots",
    "milestone",
  ];
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Version.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let versions;
    if (page !== undefined) {
      versions = await baseQuery.paginate(page, limit ?? 10);
    } else {
      versions = { data: await baseQuery };
    }
    return versions;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const version = await Version.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Version with ID ${id} does not exist`);

    return { data: version };
  }
}
