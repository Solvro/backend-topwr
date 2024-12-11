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

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router
  .group(() => {
    router.get("files/:key", [FilesController, "get"]);
    router.post("files", [FilesController, "post"]);
  })
  .prefix("api/v1");
