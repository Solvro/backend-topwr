/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from "@adonisjs/core/services/router";

import env from "#start/env";

import { middleware } from "./kernel.js";
import { resetPasswordThrottle } from "./limiter.js";

const AboutUsController = () => import("#controllers/about_us_controller");

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const AuthController = () => import("#controllers/auth_controller");
const FilesController = () => import("#controllers/files_controller");
const ResetPasswordsController = () => import("#controllers/users_controller");
const MetricsMiddleware = () => import("@solvro/solvronis-metrics");
const NewsfeedController = () => import("#controllers/newsfeed_controller");
const CacheReferenceNumberController = () =>
  import("#controllers/cache_reference_number_controller");

const configureBaseRoutes = await BaseController.configureByNames([
  "academic_calendars",
  "aeds",
  "bicycle_showers",
  "buildings",
  "campuses",
  "change_screenshots",
  "changes",
  "contributor_social_links",
  "contributors",
  "day_swaps",
  "department_links",
  "departments",
  "fields_of_study",
  "food_spots",
  "guide_articles",
  "guide_authors",
  "guide_questions",
  "holidays",
  "libraries",
  "milestones",
  "pink_boxes",
  "regular_hours",
  "roles",
  "special_hours",
  "student_organization_links",
  "student_organization_tags",
  "student_organizations",
  "version_screenshots",
  "versions",
  "event_calendar",
]);

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router.get("/metrics", [MetricsMiddleware, "emitMetrics"]);

router
  .group(() => {
    router
      .post("/", [ResetPasswordsController, "resetPassword"])
      .use(resetPasswordThrottle);
    router.put("/:token", [ResetPasswordsController, "updatePassword"]);
  })
  .use(middleware.sensitive())
  .prefix("admin/resetpassword"); //reset_password_service dependency

router
  .group(() => {
    router
      .group(() => {
        router.post("/login", [AuthController, "login"]);
        router
          .post("/logout", [AuthController, "logout"])
          .use(middleware.auth());
        router.get("/me", [AuthController, "me"]).use(middleware.auth());
      })
      .use(middleware.sensitive())
      .prefix("/auth");

    router
      .group(() => {
        router.get("/:key", [FilesController, "get"]);
        router.post("/", [FilesController, "post"]).use(middleware.auth());
      })
      .prefix("/files");

    router.get("/about_us", [AboutUsController, "index"]);

    router.get("/newsfeed/latest", [NewsfeedController, "latest"]);
    router.get("/cache_reference_number", [
      CacheReferenceNumberController,
      "index",
    ]);

    configureBaseRoutes();
  })
  .prefix("/api/v1");
