import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import ResetPasswordService from "#services/reset_password_service";
import { emailValidator } from "#validators/email";
import { passwordValidator } from "#validators/password";
import { resetPasswordTokenValidator } from "#validators/token";

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
      message: `If an account with that email exists, you will receive instructions to reset your password shortly.`,
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
    const {
      params: {
        token: { userWithToken }, // dont kill me
      },
    } = await request.validateUsing(resetPasswordTokenValidator);
    const { password } = await request.validateUsing(passwordValidator);
    await resetPasswordService.tryToResetForUser(userWithToken, password);
    return response.ok({ message: "Password updated successfully" });
  }
}
