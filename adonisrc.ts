import { defineConfig } from "@adonisjs/core/app";

// sneakily do a side-effect load of our Promise extension
import "#exceptions/context";
import "#validators/luxon_datetime";

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Commands
  |--------------------------------------------------------------------------
  |
  | List of ace commands to register from packages. The application commands
  | will be scanned automatically from the "./commands" directory.
  |
  */
  commands: [
    () => import("@adonisjs/core/commands"),
    () => import("@adonisjs/lucid/commands"),
    () => import("@adonisjs/mail/commands"),
  ],

  /*
  |--------------------------------------------------------------------------
  | Service providers
  |--------------------------------------------------------------------------
  |
  | List of service providers to import and register when booting the
  | application
  |
  */
  providers: [
    () => import("@adonisjs/core/providers/app_provider"),
    () => import("@adonisjs/core/providers/hash_provider"),
    {
      file: () => import("@adonisjs/core/providers/repl_provider"),
      environment: ["repl", "test"],
    },
    () => import("@adonisjs/core/providers/vinejs_provider"),
    () => import("@adonisjs/cors/cors_provider"),
    () => import("@adonisjs/lucid/database_provider"),
    () => import("@adonisjs/drive/drive_provider"),
    () => import("@adonisjs/auth/auth_provider"),
    () => import("@adonisjs/session/session_provider"),
    {
      file: () => import("@adminjs/adonis/adminjs_provider"),
      environment: ["web"],
    },
    () => import("@adonisjs/mail/mail_provider"),
    () => import("@adonisjs/static/static_provider"),
    () => import("@adonisjs/limiter/limiter_provider"),
  ],

  /*
  |--------------------------------------------------------------------------
  | Preloads
  |--------------------------------------------------------------------------
  |
  | List of modules to import before starting the application.
  |
  */
  preloads: [() => import("#start/routes"), () => import("#start/kernel")],

  /*
  |--------------------------------------------------------------------------
  | Tests
  |--------------------------------------------------------------------------
  |
  | List of test suites to organize tests by their type. Feel free to remove
  | and add additional suites.
  |
  */
  tests: {
    suites: [
      {
        files: ["tests/unit/**/*.spec(.ts|.js)"],
        name: "unit",
        timeout: 2000,
      },
      {
        files: ["tests/functional/**/*.spec(.ts|.js)"],
        name: "functional",
        timeout: 30000,
      },
    ],
    forceExit: false,
  },
  metaFiles: [
    { pattern: "assets/**", reloadServer: false },
    {
      pattern: "public/**",
      reloadServer: false,
    },
  ],
});
