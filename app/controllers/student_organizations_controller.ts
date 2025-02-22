import type { HttpContext } from "@adonisjs/core/http";

import StudentOrganization from "#models/student_organization";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class StudentOrganizationsController {
  protected readonly relations = ["tags", "links"];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    return StudentOrganization.query()
      .withScopes((scopes) => {
        scopes.handleSearchQuery(request.qs());
        scopes.preloadRelations(request.only(this.relations));
        scopes.handleSortQuery(request.input("sort"));
      })
      .if(page !== undefined, (query) => {
        // @ts-expect-error - It's checked for undefined above
        return query.paginate(page, limit ?? 10);
      });
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    return StudentOrganization.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["tags", "links"]));
      })
      .where("id", id)
      .firstOrFail();
  }
}
