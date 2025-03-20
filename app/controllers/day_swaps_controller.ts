import type { HttpContext } from "@adonisjs/core/http";

import DaySwap from "#models/day_swap";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class DaySwapsController {
  protected readonly relations = ["academicCalendar"];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = DaySwap.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let daySwaps;
    if (page !== undefined) {
      daySwaps = await baseQuery.paginate(page, limit ?? 10);
    } else {
      daySwaps = { data: await baseQuery };
    }
    return daySwaps;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const academicCalendar = await DaySwap.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Day swap with ID ${id} does not exist`);

    return { data: academicCalendar };
  }
}
