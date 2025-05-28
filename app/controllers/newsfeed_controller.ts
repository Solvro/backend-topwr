import { HttpContext } from "@adonisjs/core/http";

import NewsfeedService from "#services/newsfeed_service";

export default class NewsfeedController {
  private readonly newsfeedService: NewsfeedService;

  constructor(newsfeedService: NewsfeedService) {
    this.newsfeedService = newsfeedService;
  }

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
