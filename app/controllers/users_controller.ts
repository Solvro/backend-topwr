import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import ResetPasswordService from "#services/reset_password_service";
import { updatePasswordLimiter } from "#start/limiter";
import { emailValidator } from "#validators/email";
import { passwordValidator } from "#validators/password";
import { resetPasswordTokenValidator } from "#validators/reset_password_token";

export default class UsersController {
  /**
   * handle form submission for password reset request (email stage)
   */
  @inject()
  async resetPassword(
    { request, response }: HttpContext,
    resetPasswordService: ResetPasswordService,
  ) {
    const { email } = await request.validateUsing(emailValidator);
    await resetPasswordService.trySendResetUrl(email);
    return response.ok({
      message: `If an account with that email exists,
      you will receive instructions to reset your password shortly.`,
    });
  }

  /**
   * Handle form submission to update (reset) the user's password. (new credentials stage)
   */
  @inject()
  async updatePassword(
    { request, response }: HttpContext,
    resetPasswordService: ResetPasswordService,
  ) {
    const { limiter, errorMessage } = updatePasswordLimiter;
    const key = `update_password_${request.ip()}`;

    // Error raised on limiter exhaust. Only failed attempts count.
    // Fail on `.validateUsing()` will proceed with response immediately
    const [error, result] = await limiter.penalize(key, async () => {
      return await request.validateUsing(resetPasswordTokenValidator);
    });

    if (error !== null) {
      return response.tooManyRequests({
        message: errorMessage,
        retryAfter: error.response.availableIn,
      });
    }

    const {
      params: { token },
    } = result;

    const user = token.user;

    if (!token.isValid) {
      await resetPasswordService.destroyToken(user);
      return response.unauthorized({
        message: "Token expired",
      });
    }

    const { password } = await request.validateUsing(passwordValidator);
    await resetPasswordService.resetPassword(user, password);

    return response.ok({ message: "Password updated successfully" });
  }
}
