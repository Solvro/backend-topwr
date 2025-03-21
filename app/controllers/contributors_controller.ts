import { HttpContext } from "@adonisjs/core/http";

import Contributor from "#models/contributor";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class ContributorsController {
  protected readonly relations = ["roles", "milestones", "socialLinks"];
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = Contributor.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let contributors;
    if (page !== undefined) {
      contributors = await baseQuery.paginate(page, limit ?? 10);
    } else {
      contributors = { data: await baseQuery };
    }
    return contributors;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const contributor = await Contributor.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Contributor with ID ${id} does not exist`);

    return { data: contributor };
  }
}
