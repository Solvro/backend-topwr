import vine from "@vinejs/vine";

import { HttpContext } from "@adonisjs/core/http";

import {
  InternalServerException,
  UnauthorizedException,
} from "#exceptions/http_exceptions";
import User from "#models/user";
import { loginValidator, refreshTokenValidator } from "#validators/auth";

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
      return response.ok({ body: newAccessToken });
    } catch (e) {
      throw new UnauthorizedException((e as { message?: string }).message, {
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
}
