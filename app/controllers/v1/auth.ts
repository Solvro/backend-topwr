import { Acl } from "@holoyan/adonisjs-permissions";
import vine from "@vinejs/vine";
import assert from "node:assert";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { JWT_GUARD, JwtTokenResponse } from "#app/auth/guards/jwt";
import {
  ForbiddenException,
  InternalServerException,
  TooManyRequestsException,
  UnauthorizedException,
} from "#exceptions/http_exceptions";
import User from "#models/user";
import ResetPasswordService from "#services/reset_password_service";
import { middleware } from "#start/kernel";
import { resetPasswordThrottle, updatePasswordLimiter } from "#start/limiter";
import {
  changePasswordValidator,
  loginValidator,
  refreshTokenValidator,
} from "#validators/auth";
import { emailValidator } from "#validators/email";
import { newPasswordValidator } from "#validators/password";
import { resetPasswordTokenValidator } from "#validators/reset_password_token";

const allAccountsParamSchema = vine.object({
  all: vine.boolean().optional(),
});

export default class AuthController {
  $configureRoutes(controller: LazyImport<Constructor<AuthController>>) {
    router
      .group(() => {
        router.post("/login", [controller, "login"]).as("login");
        router
          .post("/refresh", [controller, "refreshAccessToken"])
          .as("refresh");
        router
          .post("/logout", [controller, "logout"])
          .use(middleware.auth())
          .as("logout");
        router.get("/me", [controller, "me"]).use(middleware.auth()).as("me");
        router
          .group(() => {
            router
              .post("/", [controller, "forgotPassword"])
              .as("request")
              .use(resetPasswordThrottle);
            router.put("/:token", [controller, "resetPassword"]).as("confirm");
          })
          .as("resetPassword")
          .prefix("/reset_password");
        router
          .post("/change_password", [controller, "changePassword"])
          .as("changePassword");
      })
      .use(middleware.sensitive());
  }

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
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    assert(auth.user !== undefined);

    const manager = Acl.model(auth.user);
    // Query roles
    const roleModels = await manager
      .roles()
      .exec()
      .addErrorContext("Failed to fetch user roles");
    const roles = roleModels.map((r) => ({
      title: r.title,
      slug: r.slug,
    }));

    // Query permissions
    const permissionModels = await manager
      .permissions()
      .addErrorContext("Failed to fetch user permissions");
    const permissions = permissionModels.map((p) => ({
      action: p.slug,
      modelName: p.entityType,
      instanceId: p.entityId,
    }));

    return {
      ...auth.getUserOrFail().serialize(),
      roles,
      permissions,
    };
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
  async changePassword({ request, response, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const user = auth.getUserOrFail();

    const form = await request.validateUsing(changePasswordValidator(user));
    await user.updatePassword(form.newPassword);
    return response.ok({
      message: "Password changed successfully",
    });
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
