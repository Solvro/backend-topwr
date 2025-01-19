import type { HttpContext } from "@adonisjs/core/http";

import GuideArticle from "#models/guide_article";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class GuideArticlesController {
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = GuideArticle.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs(), "imagePath");
      scopes.preloadRelations(request.only(["guideAuthors", "guideQuestions"]));
      scopes.handleSortQuery(request.input("sort"));
    });
    let articles;
    if (page !== undefined) {
      articles = await baseQuery.paginate(page, limit ?? 10);
    } else {
      articles = { data: await baseQuery };
    }
    return articles;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const article = await GuideArticle.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(
          request.only(["guideAuthors", "guideQuestions"]),
        );
      })
      .where("id", id)
      .firstOrFail();

    return { data: article };
  }
}
