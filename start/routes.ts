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
const FieldsOfStudiesController = () =>
  import("#controllers/fields_of_studies_controller");
const GuideArticlesController = () =>
  import("#controllers/guide_articles_controller");
const GuideAuthorsController = () =>
  import("#controllers/guide_authors_controller");
const GuideQuestionsController = () =>
  import("#controllers/guide_questions_controller");

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router
  .group(() => {
    router.get("/:key", [FilesController, "get"]);
    router.post("/", [FilesController, "post"]);
  })
  .prefix("api/v1/files");

router
  .group(() => {
    router.get("/:id", [CampusesController, "show"]);
    router.get("/", [CampusesController, "index"]);
  })
  .prefix("api/v1/campuses");

router
  .group(() => {
    router.get("/:id", [BuildingsController, "show"]);
    router.get("/", [BuildingsController, "index"]);
  })
  .prefix("api/v1/buildings");

router
  .group(() => {
    router.get("/:id", [StudentOrganizationsController, "show"]);
    router.get("/", [StudentOrganizationsController, "index"]);
  })
  .prefix("api/v1/student_organizations");

router
  .group(() => {
    router.get("/:id", [RolesController, "show"]);
    router.get("/", [RolesController, "index"]);
  })
  .prefix("api/v1/roles");

router
  .group(() => {
    router.get("/:id", [ContributorsController, "show"]);
    router.get("/", [ContributorsController, "index"]);
  })
  .prefix("api/v1/contributors");

router
  .group(() => {
    router.get("/:id", [MilestonesController, "show"]);
    router.get("/", [MilestonesController, "index"]);
  })
  .prefix("api/v1/milestones");

router
  .group(() => {
    router.get("/:id", [VersionsController, "show"]);
    router.get("/", [VersionsController, "index"]);
  })
  .prefix("api/v1/versions");

router
  .group(() => {
    router.get("/:id", [ChangesController, "show"]);
    router.get("/", [ChangesController, "index"]);
  })
  .prefix("api/v1/changes");

router
  .group(() => {
    router.get("/:id", [DepartmentsController, "show"]);
    router.get("/", [DepartmentsController, "index"]);
  })
  .prefix("api/v1/departments");

router
  .group(() => {
    router.get("/:id", [FieldsOfStudiesController, "show"]);
    router.get("/", [FieldsOfStudiesController, "index"]);
  })
  .prefix("api/v1/fields_of_study");

router
  .group(() => {
    router.get("/:id", [GuideArticlesController, "show"]);
    router.get("/", [GuideArticlesController, "index"]);
  })
  .prefix("api/v1/guide_articles");

router
  .group(() => {
    router.get("/:id", [GuideAuthorsController, "show"]);
    router.get("/", [GuideAuthorsController, "index"]);
  })
  .prefix("api/v1/guide_authors");

router
  .group(() => {
    router.get("/:id", [GuideQuestionsController, "show"]);
    router.get("/", [GuideQuestionsController, "index"]);
  })
  .prefix("api/v1/guide_questions");
