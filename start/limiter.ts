/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/
import type { Limiter } from "@adonisjs/limiter";
import limiter from "@adonisjs/limiter/services/main";

/**
 * Implement this interface for use in controllers or other parts of application
 * Limiter instance gives more granular control over middleware version
 */
interface LimiterWrapper {
  limiter: Limiter;
  errorMessage: string;
}

export const throttle = limiter.define("global", () => {
  return limiter.allowRequests(10).every("1 minute");
});

export const resetPasswordThrottle = limiter.define("reset-password", () => {
  return limiter
    .allowRequests(5)
    .every("15 minutes")
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage(
          "You've requested password reset emails too frequently. Please wait 15 minutes and try again.",
        );
    });
});

export const updatePasswordLimiter: LimiterWrapper = {
  limiter: limiter.use({
    requests: 3,
    duration: "10 minutes",
    blockDuration: "1 hour",
  }),
  errorMessage:
    "Too many password reset attempts. Please wait 1 hour before trying again",
};

/**
 * Upload rate limiter for non-admin users.
 * Admins (solvro_admin role) bypass this limit entirely.
 * Regular authenticated users are limited to 60 uploads per hour.
 */
export const uploadLimiter: LimiterWrapper = {
  limiter: limiter.use({
    requests: 60,
    duration: "1 hour",
  }),
  errorMessage:
    "Upload limit reached. You can upload at most 60 files per hour. Please try again later.",
};
