/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from "@adonisjs/core/services/router";

import { configureAllRoutes } from "#app/utils/controllers";
import env from "#start/env";

import { AutoSwaggerService } from "../docs/autoswagger/service.js";

const autoSwagger = new AutoSwaggerService();

const MetricsMiddleware = () => import("@solvro/solvronis-metrics");

router.get("/", async () => {
  return { appName: env.get("APP_NAME"), version: env.get("APP_VERSION") };
});

router.get("/metrics", [MetricsMiddleware, "emitMetrics"]);

router.get("/docs/openapi.json", async () => {
  return autoSwagger.generateSpec();
});

router.get("/docs", ({ response }) => {
  response.header("content-type", "text/html; charset=utf-8");

  return response.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ToPWR API documentation</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    >
  </head>
  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: "/docs/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true
      });
    </script>
  </body>
</html>`);
});

await configureAllRoutes();
