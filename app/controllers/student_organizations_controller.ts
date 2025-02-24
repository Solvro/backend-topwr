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
    const baseQuery = StudentOrganization.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let studentOrganizations;
    if (page !== undefined) {
      studentOrganizations = await baseQuery.paginate(page, limit ?? 10);
    } else {
      studentOrganizations = { data: await baseQuery };
    }
    return studentOrganizations;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const studentOrganization = await StudentOrganization.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["tags", "links"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: studentOrganization };
  }
}
