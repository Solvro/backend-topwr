import { HttpContext } from "@adonisjs/core/http";

import User from "#models/user";
import { loginValidator } from "#validators/auth";

export default class AuthController {
  async login({ request, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator);

    const user = await User.verifyCredentials(email, password);

    return await auth.use("jwt").generate(user, {
      properties: {
        name: user.fullName,
        email: user.email,
      },
    });
  }

  async me({ auth }: HttpContext) {
    return auth.getUserOrFail();
  }

  async logout() {
    // Cant invalidate jwt, maybe do sth  later
    // await auth.use().invalidateToken()
    return { success: true, message: "Logged out" };
  }
}
