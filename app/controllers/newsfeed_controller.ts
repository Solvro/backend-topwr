import vine from "@vinejs/vine";

import { HttpContext } from "@adonisjs/core/http";

import { ServiceUnavailableException } from "#exceptions/http_exceptions";
import NewsfeedService, {
  NEWSFEED_LANGAUGES,
} from "#services/newsfeed_service";

const validator = vine.compile(
  vine.object({
    completeOnly: vine.boolean().optional(),
    lang: vine.enum(NEWSFEED_LANGAUGES).optional(),
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
    const { completeOnly, lang } = await request.validateUsing(validator);

    await NewsfeedService.startNewsfeedUpdate();
    const update = NewsfeedService.getLatestNewsfeedArticles(
      lang ?? "pl",
      completeOnly ?? true,
    );

    if (update === null) {
      throw new ServiceUnavailableException(
        "Could not get latest newsfeed articles. Please try again later.",
      );
    }
    return response.ok(update);
  }

  /**
   * Returns the stats for currently stored newsfeed articles from the PWr website
   * as a map of language codes to article statistics of type {@link NewsfeedStats}.
   * If a language code is not present, it means that the service failed to get articles for that language.
   * @returns 200 with an object with NewsfeedStats for each language code
   */
  async stats({ response }: HttpContext) {
    await NewsfeedService.startNewsfeedUpdate();
    return response.ok(NewsfeedService.getStats());
  }
}
