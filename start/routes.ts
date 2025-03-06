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

import { resetPasswordThrottle } from "./limiter.js";

const FilesController = () => import("#controllers/files_controller");
const BuildingsController = () => import("#controllers/buildings_controller");
const CampusesController = () => import("#controllers/campuses_controller");
const StudentOrganizationsController = () =>
  import("#controllers/student_organizations_controller");
const RolesController = () => import("#controllers/roles_controller");
const ContributorsController = () =>
  import("#controllers/contributors_controller");
const MilestonesController = () => import("#controllers/milestones_controller");
const VersionsController = () => import("#controllers/versions_controller");
const ChangesController = () => import("#controllers/changes_controller");
const DepartmentsController = () =>
  import("#controllers/departments_controller");
const FieldsOfStudyController = () =>
  import("#controllers/fields_of_study_controller");
const GuideArticlesController = () =>
  import("#controllers/guide_articles_controller");
const GuideAuthorsController = () =>
  import("#controllers/guide_authors_controller");
const GuideQuestionsController = () =>
  import("#controllers/guide_questions_controller");
const AboutUsController = () => import("#controllers/about_us_controller");
const AcademicCalendarsController = () =>
  import("#controllers/academic_calendars_controller");
const HolidaysController = () => import("#controllers/holidays_controller");
const DaySwapsController = () => import("#controllers/day_swaps_controller");
const LibrariesController = () => import("#controllers/libraries_controller");
const ResetPasswordsController = () => import("#controllers/users_controller");

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router
  .group(() => {
    router.post("/", [ResetPasswordsController, "resetPassword"]);
    router.put("/:token", [ResetPasswordsController, "updatePassword"]);
  })
  .use(resetPasswordThrottle)
  .prefix("admin/resetpassword"); //reset_password_service dependency

router
  .group(() => {
    router
      .group(() => {
        router.get("/:key", [FilesController, "get"]);
        router.post("/", [FilesController, "post"]);
      })
      .prefix("/files");

    router
      .group(() => {
        router.get("/:id", [CampusesController, "show"]);
        router.get("/", [CampusesController, "index"]);
      })
      .prefix("/campuses");

    router
      .group(() => {
        router.get("/:id", [BuildingsController, "show"]);
        router.get("/", [BuildingsController, "index"]);
      })
      .prefix("/buildings");

    router
      .group(() => {
        router.get("/:id", [LibrariesController, "show"]);
        router.get("/", [LibrariesController, "index"]);
      })
      .prefix("/libraries");

    router
      .group(() => {
        router.get("/:id", [StudentOrganizationsController, "show"]);
        router.get("/", [StudentOrganizationsController, "index"]);
      })
      .prefix("/student_organizations");

    router
      .group(() => {
        router.get("/:id", [RolesController, "show"]);
        router.get("/", [RolesController, "index"]);
      })
      .prefix("/roles");

    router
      .group(() => {
        router.get("/:id", [ContributorsController, "show"]);
        router.get("/", [ContributorsController, "index"]);
      })
      .prefix("/contributors");

    router
      .group(() => {
        router.get("/:id", [MilestonesController, "show"]);
        router.get("/", [MilestonesController, "index"]);
      })
      .prefix("/milestones");

    router
      .group(() => {
        router.get("/:id", [VersionsController, "show"]);
        router.get("/", [VersionsController, "index"]);
      })
      .prefix("/versions");

    router
      .group(() => {
        router.get("/:id", [ChangesController, "show"]);
        router.get("/", [ChangesController, "index"]);
      })
      .prefix("/changes");

    router
      .group(() => {
        router.get("/:id", [DepartmentsController, "show"]);
        router.get("/", [DepartmentsController, "index"]);
      })
      .prefix("/departments");

    router
      .group(() => {
        router.get("/:id", [FieldsOfStudyController, "show"]);
        router.get("/", [FieldsOfStudyController, "index"]);
      })
      .prefix("/fields_of_study");

    router
      .group(() => {
        router.get("/:id", [GuideArticlesController, "show"]);
        router.get("/", [GuideArticlesController, "index"]);
      })
      .prefix("/guide_articles");

    router
      .group(() => {
        router.get("/:id", [GuideAuthorsController, "show"]);
        router.get("/", [GuideAuthorsController, "index"]);
      })
      .prefix("/guide_authors");

    router
      .group(() => {
        router.get("/:id", [GuideQuestionsController, "show"]);
        router.get("/", [GuideQuestionsController, "index"]);
      })
      .prefix("/guide_questions");

    router
      .group(() => {
        router.get("/", [AboutUsController, "index"]);
      })
      .prefix("/about_us");

    router
      .group(() => {
        router.get("/:id", [AcademicCalendarsController, "show"]);
        router.get("/", [AcademicCalendarsController, "index"]);
      })
      .prefix("/academic_calendars");

    router
      .group(() => {
        router.get("/:id", [HolidaysController, "show"]);
        router.get("/", [HolidaysController, "index"]);
      })
      .prefix("/holidays");

    router
      .group(() => {
        router.get("/:id", [DaySwapsController, "show"]);
        router.get("/", [DaySwapsController, "index"]);
      })
      .prefix("/day_swaps");
  })
  .prefix("/api/v1");
