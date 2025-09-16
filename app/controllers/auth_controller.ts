import vine from "@vinejs/vine";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import {
  ForbiddenException,
  InternalServerException,
  TooManyRequestsException,
  UnauthorizedException,
} from "#exceptions/http_exceptions";
import User from "#models/user";
import ResetPasswordService from "#services/reset_password_service";
import { updatePasswordLimiter } from "#start/limiter";
import {
  changePasswordValidator,
  loginValidator,
  refreshTokenValidator,
} from "#validators/auth";
import { emailValidator } from "#validators/email";
import { newPasswordValidator } from "#validators/password";
import { resetPasswordTokenValidator } from "#validators/reset_password_token";

import { JWT_GUARD, JwtTokenResponse } from "../auth/guards/jwt.js";

const allAccountsParamSchema = vine.object({
  all: vine.boolean().optional(),
});

export default class AuthController {
  async login({ request, auth }: HttpContext): Promise<JwtTokenResponse> {
    const { email, password } = await request.validateUsing(loginValidator);
    const user = await User.verifyCredentials(email, password);
    return await auth.use(JWT_GUARD).generateOnLogin(user);
  }

  async refreshAccessToken({ request, response, auth }: HttpContext) {
    const { refreshToken } = await request.validateUsing(refreshTokenValidator);
    try {
      const newAccessToken = await auth
        .use(JWT_GUARD)
        .refreshAccessToken(refreshToken);
      return response.ok({ newAccessToken });
    } catch (e) {
      throw new ForbiddenException("Invalid refresh token", {
        cause: e,
        sensitive: true,
      });
    }
  }

  async me({ auth }: HttpContext) {
    return auth.getUserOrFail();
  }

  async logout({ request, auth, response }: HttpContext) {
    const jwtGuard = auth.use(JWT_GUARD);
    const user = jwtGuard.getUserOrFail();
    const userId = user.id;
    const { all } = await vine.validate({
      schema: allAccountsParamSchema,
      data: { all: request.input("all", "false") === "true" },
    });
    if (all === true) {
      // Invalidate all tokens for the account
      const invalidationResult =
        await jwtGuard.invalidateAllRefreshTokensForUser(userId);
      if (!invalidationResult) {
        throw new InternalServerException(
          "Failed to invalidate the refresh tokens",
        );
      }
      return response.ok({
        message: "All refresh tokens marked as invalid",
      });
    }
    const { refreshToken } = await request.validateUsing(refreshTokenValidator);
    // Invalidate the provided token
    const invalidationResult =
      await jwtGuard.invalidateRefreshToken(refreshToken);
    if (!invalidationResult) {
      throw new InternalServerException(
        "Failed to invalidate the refresh tokens",
      );
    }
    return response.ok({
      message: "Invalidated the provided refresh token",
    });
  }

  /*
   * Change password for currently logged in user, using it's active session
   */
  async changePassword({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const user = auth.getUserOrFail();

    const form = await request.validateUsing(changePasswordValidator(user));
    await user.updatePassword(form.newPassword);
  }

  /**
   * Request password reset for unlogged user.
   */
  @inject()
  async forgotPassword(
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
   * Handle form submission to reset the password
   */
  async resetPassword({ request, response }: HttpContext) {
    const { limiter, errorMessage } = updatePasswordLimiter;
    const limiterKey = `update_password_${request.ip()}`;

    // Error raised on limiter exhaust. Only failed attempts count.
    // Fail on `.validateUsing()` will proceed with response immediately
    const [error, result] = await limiter.penalize(limiterKey, async () => {
      return await request.validateUsing(resetPasswordTokenValidator);
    });

    if (error !== null) {
      throw new TooManyRequestsException(errorMessage, {
        extraResponseFields: { retryAfter: error.response.availableIn },
      });
    }

    const token = result.params.token;

    if (!token.isValid) {
      token.user.clearResetToken();
      await token.user.save();
      throw new UnauthorizedException("Token expired");
    }

    const { password } = await request.validateUsing(newPasswordValidator);
    await token.user.updatePassword(password, { reset: true });

    return response.ok({ message: "Password updated successfully" });
  }
}
