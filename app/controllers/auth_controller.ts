import assert from "node:assert";

import { HttpContext } from "@adonisjs/core/http";

import User from "#models/user";
import { loginValidator } from "#validators/auth";

export default class AuthController {
  async login({ request }: HttpContext) {
    const { email, password, rememberMe } =
      await request.validateUsing(loginValidator);

    const user = await User.verifyCredentials(email, password);
    const token = await User.accessTokens.create(user, [], {
      expiresIn: rememberMe === true ? "30 days" : "1 day",
    });

    assert(token.value !== undefined, "Token value is missing");

    return {
      user,
      token: token.value.release(),
    };
  }

  async me({ auth }: HttpContext) {
    return auth.getUserOrFail();
  }

  async logout({ auth }: HttpContext) {
    await auth.use().invalidateToken();
    return { success: true, message: "Logged out" };
  }
}
