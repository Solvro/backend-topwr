import type { HttpContext } from "@adonisjs/core/http";

import FieldsOfStudy from "#models/field_of_study";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class FieldsOfStudiesController {
  protected readonly relations = ["department"];

  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = FieldsOfStudy.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs(), "url");
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let fieldsOfStudies;
    if (page !== undefined) {
      fieldsOfStudies = await baseQuery.paginate(page, limit ?? 10);
    } else {
      fieldsOfStudies = { data: await baseQuery };
    }
    return fieldsOfStudies;
  }

  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const fieldsOfStudy = await FieldsOfStudy.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail();

    return { data: fieldsOfStudy };
  }
}
