import { HttpContext } from "@adonisjs/core/http";

import Milestone from "#models/milestone";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class MilestonesController {
  protected readonly relations = [
    "contributors",
    "contributors.socialLinks",
    "versions",
    "versions.screenshots",
    "versions.changes",
    "versions.changes.screenshots",
  ];

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Milestone.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let milestones;
    if (page !== undefined) {
      milestones = await baseQuery.paginate(page, limit ?? 10);
    } else {
      milestones = { data: await baseQuery };
    }
    return milestones;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const milestone = await Milestone.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Milestone with ID ${id} does not exist`);

    return { data: milestone };
  }
}
