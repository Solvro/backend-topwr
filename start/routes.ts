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

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

const MetricsMiddleware = () => import("@solvro/solvronis-metrics");

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router.get("/metrics", [MetricsMiddleware, "emitMetrics"]);

await BaseController.configureAll();
