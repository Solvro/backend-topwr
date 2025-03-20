import type { HttpContext } from "@adonisjs/core/http";

import Holiday from "#models/holiday";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class HolidaysController {
  protected readonly relations = ["academicCalendar"];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Holiday.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let holidays;
    if (page !== undefined) {
      holidays = await baseQuery.paginate(page, limit ?? 10);
    } else {
      holidays = { data: await baseQuery };
    }
    return holidays;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const academicCalendar = await Holiday.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Holiday with ID ${id} does not exist`);

    return { data: academicCalendar };
  }
}
