import { HttpContext, Request } from "@adonisjs/core/http";

import User from "#models/user";
import { loginValidator } from "#validators/auth";

import { JWT_GUARD, JwtTokenResponse } from "../auth/guards/jwt.js";

export default class AuthController {
  async login({ request, auth }: HttpContext): Promise<JwtTokenResponse> {
    const { email, password } = await request.validateUsing(loginValidator);
    const user = await User.verifyCredentials(email, password);
    return await auth.use(JWT_GUARD).generateOnLogin(user);
  }

  private extractRefreshToken(request: Request): string | undefined {
    const body = request.body();
    const refreshToken: unknown = body.refreshToken;
    if (typeof refreshToken !== "string") {
      return undefined;
    }
    return refreshToken;
  }

  async refreshAccessToken({ request, response, auth }: HttpContext) {
    const refreshToken: string | undefined = this.extractRefreshToken(request);
    if (refreshToken === undefined) {
      return response.badRequest({ error: "Refresh token is required" });
    }
    try {
      const newAccessToken = await auth
        .use(JWT_GUARD)
        .refreshAccessToken(refreshToken);
      return response.ok({ body: newAccessToken });
    } catch {
      return response.forbidden({ error: "Invalid or expired refresh token" });
    }
  }

  async me({ auth }: HttpContext) {
    return auth.getUserOrFail();
  }

  async logout({ request, auth, response }: HttpContext) {
    const jwtGuard = auth.use(JWT_GUARD);
    const user = jwtGuard.getUserOrFail();
    const userId = user.id;
    const allAccounts: unknown = request.input("all");
    if (typeof allAccounts === "string" && allAccounts === "true") {
      // Invalidate all tokens for the account
      const invalidationResult =
        await jwtGuard.invalidateAllRefreshTokensForUser(userId);
      if (!invalidationResult) {
        return response.internalServerError({
          success: false,
          message: "Failed to invalidate the refresh tokens",
        });
      }
      return response.ok({
        success: true,
        message: "All refresh tokens marked as invalid",
      });
    }
    const refreshToken = this.extractRefreshToken(request);
    if (refreshToken === undefined) {
      return response.badRequest({
        success: false,
        message: "No refresh token provided. Cannot invalidate",
      });
    }
    // Invalidate the provided token
    const invalidationResult =
      await jwtGuard.invalidateRefreshToken(refreshToken);
    if (!invalidationResult) {
      return response.internalServerError({
        success: false,
        message: "Failed to invalidate refresh token",
      });
    }
    return response.ok({
      success: true,
      message: "Invalidated the provided refresh token",
    });
  }
}
