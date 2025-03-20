import type { HttpContext } from "@adonisjs/core/http";

import AcademicCalendar from "#models/academic_calendar";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class AcademicCalendarsController {
  protected readonly relations = ["holidays", "daySwaps"];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = AcademicCalendar.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let academicCalendars;
    if (page !== undefined) {
      academicCalendars = await baseQuery.paginate(page, limit ?? 10);
    } else {
      academicCalendars = { data: await baseQuery };
    }
    return academicCalendars;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const academicCalendar = await AcademicCalendar.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Academic calendar with ID ${id} does not exist`);

    return { data: academicCalendar };
  }
}
