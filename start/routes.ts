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
