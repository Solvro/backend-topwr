import { HttpContext } from "@adonisjs/core/http";

import DepartmentsLink from "#models/department_link";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class DepartmentsLinksController {
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = DepartmentsLink.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs(), "linkType");
      scopes.preloadRelations(request.only(["departments"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    let departmentLinks;
    if (page !== undefined) {
      departmentLinks = await baseQuery.paginate(page, limit ?? 10);
    } else {
      departmentLinks = { data: await baseQuery };
    }
    return departmentLinks;
  }

  public async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const departmentLinks = await DepartmentsLink.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["campus"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: departmentLinks };
  }
}
