import jwt from "jsonwebtoken";

import { errors, symbols } from "@adonisjs/auth";
import { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";

export interface JwtGuardOptions {
  secret: string;
}

/**
 * The bridge between the User provider and the
 * Guard
 */
export interface JwtGuardUser<RealUser> {
  /**
   * Returns the unique ID of the user
   */
  getId(): string | number | bigint;

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser;
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export interface JwtUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]: RealUser;

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>;

  /**
   * Find a user by their id.
   */
  findById(
    identifier: string | number | bigint,
  ): Promise<JwtGuardUser<RealUser> | null>;
}

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #ctx: HttpContext;
  #userProvider: UserProvider;
  #options: JwtGuardOptions;
  constructor(
    ctx: HttpContext,
    userProvider: UserProvider,
    options: JwtGuardOptions,
  ) {
    this.#userProvider = userProvider;
    this.#options = options;
    this.#ctx = ctx;
  }

  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  /**
   * A unique name for the guard driver
   */
  driverName = "jwt" as const;

  /**
   * A flag to know if the authentication was an attempt
   * during the current HTTP request
   */
  authenticationAttempted = false;

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated = false;

  /**
   * Reference to the currently authenticated user
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER];

  /**
   * Generate a JWT token for a given user.
   */
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
    p0: {
      properties: { name: string | null; email: string };
    },
  ) {
    const providerUser = await this.#userProvider.createUserForGuard(user);
    const token = jwt.sign(
      { userId: providerUser.getId() },
      this.#options.secret,
    );

    return {
      type: "bearer",
      token,
      payload: p0.properties,
    };
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<
    UserProvider[typeof symbols.PROVIDER_REAL_USER]
  > {
    /**
     * Avoid re-authentication when it has been done already
     * for the given request
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }
    this.authenticationAttempted = true;

    /**
     * Ensure the auth header exists
     */
    const authHeader = this.#ctx.request.header("authorization");
    if (authHeader === undefined) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    /**
     * Split the header value and read the token from it
     */
    const [, token] = authHeader.split("Bearer ");
    if (!token) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    /**
     * Verify token
     */
    const payload = jwt.verify(token, this.#options.secret);
    if (typeof payload !== "object" || !("userId" in payload)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    /**
     * Fetch the user by user ID and save a reference to it
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const providerUser = await this.#userProvider.findById(payload.userId);
    if (providerUser === null) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    this.user = providerUser.getOriginal();
    return this.getUserOrFail();
  }

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!this.user) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    return this.user;
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
  ): Promise<AuthClientResponse> {
    // @ts-ignore
    const token = await this.generate(user);
    return {
      headers: {
        authorization: `Bearer ${token.token}`,
      },
    };
  }
}
