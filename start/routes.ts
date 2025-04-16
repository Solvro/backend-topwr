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

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const AuthController = () => import("#controllers/auth_controller");
const FilesController = () => import("#controllers/files_controller");
const ResetPasswordsController = () => import("#controllers/users_controller");

const configureBaseRoutes = await BaseController.configureByNames([
  "academic_calendars",
  "buildings",
  "campuses",
  "changes",
  "contributors",
  "day_swaps",
  "departments",
  "fields_of_study",
  "guide_articles",
  "guide_authors",
  "guide_questions",
  "holidays",
  "libraries",
  "milestones",
  "roles",
  "student_organizations",
  "versions",
]);

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

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

    configureBaseRoutes();
  })
  .prefix("/api/v1");
