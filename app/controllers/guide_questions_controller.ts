import type { HttpContext } from "@adonisjs/core/http";

import GuideQuestion from "#models/guide_question";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

export default class GuideQuestionsController {
  protected readonly relations = ["guideArticle"];
  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const { page, limit } = await request.validateUsing(paginationValidator);
    const baseQuery = GuideQuestion.query().withScopes((scopes) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(request.only(this.relations));
      scopes.handleSortQuery(request.input("sort"));
    });
    let questions;
    if (page !== undefined) {
      questions = await baseQuery.paginate(page, limit ?? 10);
    } else {
      questions = { data: await baseQuery };
    }
    return questions;
  }

  /**
   * Show individual record
   */
  async show({ request }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator);
    const question = await GuideQuestion.query()
      .withScopes((scopes) => {
        scopes.preloadRelations(request.only(this.relations));
      })
      .where("id", id)
      .firstOrFail()
      .addErrorContext(() => `Guide question with ID ${id} does not exist`);

    return { data: question };
  }
}
