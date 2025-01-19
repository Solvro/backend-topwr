import type { HttpContext } from "@adonisjs/core/http";

import GuideAuthor from "#models/guide_author";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class GuideAuthorsController {
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = GuideAuthor.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(["guideArticles"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    let authors;
    if (page !== undefined) {
      authors = await baseQuery.paginate(page, limit ?? 10);
    } else {
      authors = { data: await baseQuery };
    }
    return authors;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const author = await GuideAuthor.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(["guideArticles"]));
      })
      .where("id", id)
      .firstOrFail();

    return { data: author };
  }
}
