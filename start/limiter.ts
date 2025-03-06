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
import limiter from "@adonisjs/limiter/services/main";

export const throttle = limiter.define("global", () => {
  return limiter.allowRequests(10).every("1 minute");
});

export const resetPasswordThrottle = limiter.define("reset-password", () => {
  return limiter
    .allowRequests(5)
    .every("10 mins")
    .blockFor("1 hour") //24 hours pure evil
    .limitExceeded((error) => {
      error
        .setStatus(429)
        .setMessage(
          "Maximum password reset attempts reached. Please try again later in 1 hour",
        );
    });
});
