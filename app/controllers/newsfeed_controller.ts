import { HttpContext } from "@adonisjs/core/http";

import NewsfeedService from "#services/newsfeed_service";

export default class NewsfeedController {
  private readonly newsfeedService: NewsfeedService;

  constructor() {
    this.newsfeedService = new NewsfeedService();
  }

  /**
   * Returns the latest available, first page, newsfeed articles from the PWr website
   * as an array of {@link NewsfeedArticle}.
   * It may return old articles if successive scraping attempts were failures.
   * Pass 'completeOnly' query param as true in the request to only get articles that were scraped in full.
   * @returns 200 NewsfeedArticle[] or 503 with an error message
   */
  async latest({ request, response }: HttpContext) {
    const completeOnly = request.qs().completeOnly === "true";
    const articles = completeOnly
      ? this.newsfeedService.getLatestNewsfeedArticles(true)
      : this.newsfeedService.getLatestNewsfeedArticles();
    if (articles === null) {
      return response.serviceUnavailable(
        "Couldn't fetch newsfeed articles. Please try again later.",
      );
    }
    return response.ok(articles);
  }
}
