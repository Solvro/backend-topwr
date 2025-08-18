import { defineConfig } from "@adonisjs/auth";
import { tokensGuard, tokensUserProvider } from "@adonisjs/auth/access_tokens";
import type {
  Authenticators,
  InferAuthEvents,
  InferAuthenticators,
} from "@adonisjs/auth/types";

import env from "#start/env";

import { JwtGuard } from "../app/auth/guards/jwt.js";
import { JwtLucidUserProvider } from "../app/auth/jwt_user_provider.js";

const jwtConfig = {
  secret: env.get("APP_KEY"),
};

const authConfig = defineConfig({
  default: "jwt",
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: "accessTokens",
        model: () => import("#models/user"),
      }),
    }),
    jwt: (ctx) => {
      const userModel = import("#models/user");
      const provider = userModel.then(
        (model) => new JwtLucidUserProvider(model.default),
      );
      return new JwtGuard(ctx, provider, jwtConfig);
    },
  },
});

export default authConfig;

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module "@adonisjs/auth/types" {
  export interface Authenticators
    extends InferAuthenticators<typeof authConfig> {}
}
declare module "@adonisjs/core/types" {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
