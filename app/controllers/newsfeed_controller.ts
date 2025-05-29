import { HttpContext } from "@adonisjs/core/http";

import NewsfeedService from "#services/newsfeed_service";

export default class NewsfeedController {
  /**
   * Returns the latest available, first page, newsfeed articles from the PWr website
   * as an object with array of articles of {@link NewsfeedArticle} and update time (see {@link NewsfeedUpdate}).
   * It may return old articles if successive scraping attempts were failures - refer to update time to judge the recency.
   * Pass 'completeOnly=true' query param in the request to only get articles that were scraped in full (no missing fields).
   * @returns 200 NewsfeedUpdate or 503 with an error message
   */
  async latest({ request, response }: HttpContext) {
    await NewsfeedService.startNewsfeedUpdate();
    const completeOnly = request.qs().completeOnly === "true";
    const update = completeOnly
      ? NewsfeedService.getLatestNewsfeedArticles(true)
      : NewsfeedService.getLatestNewsfeedArticles();
    if (update === null) {
      return response.serviceUnavailable(
        "Couldn't fetch newsfeed articles. Please try again later.",
      );
    }
    return response.ok(update);
  }
}
