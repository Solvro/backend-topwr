/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/
import { Env } from "@adonisjs/core/env";

export default await Env.create(new URL("../", import.meta.url), {
  NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: "host" }),
  LOG_LEVEL: Env.schema.enum([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
  ]),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: "host" }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(["fs"] as const),
  APP_URL: Env.schema.string(), // should be { format: 'url' } but it's not working with localhost

  APP_NAME: Env.schema.string(),
  APP_VERSION: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(["cookie", "memory"] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string(),
  SMTP_PORT: Env.schema.string(),

  SMTP_USERNAME: Env.schema.string(),

  SMTP_PASSWORD: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(["database", "memory"] as const),

  // JWT secrets
  ACCESS_SECRET: Env.schema.string(), // HMAC secret (can be literally anything)
  REFRESH_PK: Env.schema.string(), // In for ECDSA384, as single line string, without /n and PEM headers

  // Image resizing options
  MINIATURE_MAX_HEIGHT_PX: Env.schema.number(), // Height of resized images - width auto-scales according to the height to prevent stretching
  MINIATURE_MAX_PROCESSING_TIME_S: Env.schema.number(), // Maximum time in seconds per image resizing - will throw if the time exceeds the value
});
