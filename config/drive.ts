import * as fs from "node:fs";
import * as Path from "node:path";

import app from "@adonisjs/core/services/app";
import { defineConfig, services } from "@adonisjs/drive";

import env from "#start/env";

const STORAGE_PATH = app.makePath("storage");
const MINIATURES_STORAGE_PATH = app.makePath(
  Path.join(STORAGE_PATH, "miniatures"),
);

if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

export const MAIN_DRIVE = env.get("DRIVE_DISK");
export const MINIATURES_DRIVE = "miniatures";
export type DriveType = typeof MAIN_DRIVE | typeof MINIATURES_DRIVE;

const driveConfig = defineConfig({
  default: MAIN_DRIVE,

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    [MAIN_DRIVE]: services.fs({
      location: STORAGE_PATH,
      serveFiles: true,
      routeBasePath: "/uploads",
      visibility: "public",
      appUrl: env.get("APP_URL"),
    }),
    miniatures: services.fs({
      location: MINIATURES_STORAGE_PATH,
      serveFiles: true,
      routeBasePath: "/uploads/miniatures",
      visibility: "public",
      appUrl: env.get("APP_URL"),
    }),
  },
});

export default driveConfig;

declare module "@adonisjs/drive/types" {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
