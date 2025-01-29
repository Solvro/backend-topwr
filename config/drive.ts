import * as fs from "node:fs";

import app from "@adonisjs/core/services/app";
import { defineConfig, services } from "@adonisjs/drive";

import env from "#start/env";

const storagePath = app.makePath("storage");

if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const driveConfig = defineConfig({
  default: env.get("DRIVE_DISK"),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    fs: services.fs({
      location: storagePath,
      serveFiles: true,
      routeBasePath: "/uploads",
      visibility: "public",
      appUrl: env.get("APP_URL"),
    }),
  },
});

export default driveConfig;

declare module "@adonisjs/drive/types" {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
