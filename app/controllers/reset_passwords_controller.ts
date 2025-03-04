import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import BadRequestException from "#exceptions/bad_request_exception";
import ResetPasswordService from "#services/reset_password_service";
import { emailValidator } from "#validators/email";

export default class ResetPasswordsController {
  /**
   * Page for password form submission
   */
  @inject()
  async store(
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
   * Handle form submission to update (reset) the user's password.
   */
  @inject()
  async update(
    { request, response }: HttpContext,
    resetPasswordService: ResetPasswordService,
  ) {
    const token = request.param("token") as string;
    const { password } = request.body() as { password: string | undefined };
    if (password === undefined) {
      throw new BadRequestException("No password provided");
    }
    await resetPasswordService.tryToResetForTokenOrFail(token, password);
    return response.ok({ message: "Password updated successfully" });
  }
}
