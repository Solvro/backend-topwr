import type { HttpContext } from "@adonisjs/core/http";

import Department from "#models/department";
import { showValidator } from "#validators/show";

export default class DepartmentsController {
  async index({ request }: HttpContext) {
    const departments = await Department.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.only(["id", "createdAt", "updatedAt"]));
      scopes.includeRelations(request.only(["departments"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    return { data: departments };
  }

  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const department = await Department.query()
      .withScopes((scopes) => {
        scopes.includeRelations(request.only(["departments"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: department };
  }
}
