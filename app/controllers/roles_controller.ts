import { HttpContext } from "@adonisjs/core/http";

import Role from "#models/role";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class RolesController {
  protected readonly relations = [
    "contributors",
    "contributors.socialLinks",
    "contributors.milestones",
  ];
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Role.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let roles;
    if (page !== undefined) {
      roles = await baseQuery.paginate(page, limit ?? 10);
    } else {
      roles = { data: await baseQuery };
    }
    return roles;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const role = await Role.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail();

    return { data: role };
  }
}
