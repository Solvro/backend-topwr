import vine from "@vinejs/vine";

import { HttpContext } from "@adonisjs/core/http";

import { ServiceUnavailableException } from "#exceptions/http_exceptions";
import NewsfeedService from "#services/newsfeed_service";

const completeOnlyValidator = vine.compile(
  vine.object({
    completeOnly: vine.boolean(),
  }),
);

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
    const { completeOnly } = await request.validateUsing(completeOnlyValidator);
    const update = completeOnly
      ? NewsfeedService.getLatestNewsfeedArticles(true)
      : NewsfeedService.getLatestNewsfeedArticles();
    if (update === null) {
      throw new ServiceUnavailableException(
        "Could not get latest newsfeed articles. Please try again later.",
      );
    }
    return response.ok(update);
  }
}
