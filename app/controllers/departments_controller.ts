import type { HttpContext } from "@adonisjs/core/http";

import Department from "#models/department";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class DepartmentsController {
  protected readonly relations = ["fieldOfStudy", "departmentLink"];

  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Department.query().withScopes((scopes) => {
      scopes.handleSearchQuery(
        request.qs(),
        "logo",
        "description",
        "gradientStart",
        "gradientStop",
      );
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });

    let departments;
    if (page !== undefined) {
      departments = await baseQuery.paginate(page, limit ?? 10);
    } else {
      departments = { data: await baseQuery };
    }
    return departments;
  }

  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const department = await Department.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail();

    return { data: department };
  }
}
