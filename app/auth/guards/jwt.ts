import jwt from "jsonwebtoken";

import { errors, symbols } from "@adonisjs/auth";
import { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";

export interface JwtGuardOptions {
  secret: string;
  expiresIn?: number; // w sekundach, domyślnie 3600 (1 godzina)
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
   * Find a user by their email.
   */
  findByEmail(email: string): Promise<JwtGuardUser<RealUser> | null>;
}

export class JwtGuard<UserProvider extends JwtUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #ctx: HttpContext;
  #userProvider: UserProvider | Promise<UserProvider>;
  #options: JwtGuardOptions;
  #resolvedUserProvider?: UserProvider;

  constructor(
    ctx: HttpContext,
    userProvider: UserProvider | Promise<UserProvider>,
    options: JwtGuardOptions,
  ) {
    this.#userProvider = userProvider;
    this.#options = options;
    this.#ctx = ctx;
  }

  /**
   * Resolve the user provider if it's a promise
   */
  async #getUserProvider(): Promise<UserProvider> {
    if (this.#resolvedUserProvider !== undefined) {
      return this.#resolvedUserProvider;
    }

    if (this.#userProvider instanceof Promise) {
      this.#resolvedUserProvider = await this.#userProvider;
    } else {
      this.#resolvedUserProvider = this.#userProvider;
    }

    return this.#resolvedUserProvider;
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
  async generate(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
    const userProvider = await this.#getUserProvider();
    await userProvider.createUserForGuard(user);
    const { email, role } = user as {
      email?: string;
      role?: string;
    };
    const iat = Math.floor(Date.now() / 1000);
    const expiresIn = this.#options.expiresIn ?? 3600; // domyślnie 1 godzina
    const exp = iat + expiresIn;
    const token = jwt.sign(
      {
        role,
        aud: "admin.topwr.solvro.pl",
        sub: email,
        iss: "admin.topwr.solvro.pl",
        iat,
        exp,
      },
      this.#options.secret,
    );

    return {
      type: "bearer",
      token,
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
    const authHeader = this.#ctx.request.header("Authorization");
    if (authHeader === undefined) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      }) as Error;
    }

    /**
     * Split the header value and read the token from it
     */
    if (!authHeader.startsWith("Bearer ")) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      }) as Error;
    } //throw here
    const token = authHeader.substring(7);

    /**
     * Verify token
     */
    let payload;
    try {
      payload = jwt.verify(token, this.#options.secret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new errors.E_UNAUTHORIZED_ACCESS("Token has expired", {
          guardDriverName: this.driverName,
        }) as Error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new errors.E_UNAUTHORIZED_ACCESS("Invalid token", {
          guardDriverName: this.driverName,
        }) as Error;
      }
      throw new errors.E_UNAUTHORIZED_ACCESS("Token verification failed", {
        guardDriverName: this.driverName,
      }) as Error;
    }

    if (
      typeof payload !== "object" ||
      !("sub" in payload) ||
      typeof payload.sub !== "string"
    ) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Invalid token payload", {
        guardDriverName: this.driverName,
      }) as Error;
    }

    /**
     * Fetch the user by user ID and save a reference to it
     */
    const userProvider = await this.#getUserProvider();
    const providerUser = await userProvider.findByEmail(payload.sub);
    if (providerUser === null) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      }) as Error;
    }

    this.user = providerUser.getOriginal();
    const user = this.getUserOrFail();
    this.isAuthenticated = true;
    return user;
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
    if (this.user === undefined) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      }) as Error;
    }

    return this.user;
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to log in the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
  ): Promise<AuthClientResponse> {
    const token = await this.generate(user);
    return {
      headers: {
        authorization: `Bearer ${token.token}`,
      },
    };
  }
}
