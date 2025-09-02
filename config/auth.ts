import { defineConfig } from "@adonisjs/auth";
import { tokensGuard, tokensUserProvider } from "@adonisjs/auth/access_tokens";
import type {
  Authenticators,
  InferAuthEvents,
  InferAuthenticators,
} from "@adonisjs/auth/types";

import { JwtGuard } from "../app/auth/guards/jwt.js";

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
      return new JwtGuard(ctx);
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
