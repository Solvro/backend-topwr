import jwt from "jsonwebtoken";
import { DateTime, Duration } from "luxon";
import assert from "node:assert";
import { UUID, createPublicKey, randomUUID } from "node:crypto";

import { symbols } from "@adonisjs/auth";
import { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import logger from "@adonisjs/core/services/logger";

import {
  ForbiddenException,
  UnauthorizedException,
} from "#exceptions/http_exceptions";
import RefreshToken from "#models/refresh_token";
import User from "#models/user";
import env from "#start/env";

export interface JwtAccessTokenResponse {
  type: "bearer";
  accessToken: string;
  accessExpiresInMs: number;
}

export interface JwtTokenResponse extends JwtAccessTokenResponse {
  refreshToken: string;
  refreshExpiresInMs: number;
}

export const JWT_GUARD = "jwt";
const AUDIENCE = "admin.topwr.solvro.pl"; // that's whoever wants to respect our tokens - so just us for now
const ISSUER = "admin.topwr.solvro.pl"; // that's us
const ACCESS_EXPIRES_IN_MS = Number.parseInt(
  env.get("ACCESS_EXPIRES_IN_MS", "3600000"),
); // 1 hour
const REFRESH_EXPIRES_IN_MS = Number.parseInt(
  env.get("REFRESH_EXPIRES_IN_MS", "604800000"),
); // 7 days
const ACCESS_SECRET = assertIsDefined(env.get("ACCESS_SECRET")); // For HMAC256
const REFRESH_PK = formatPrivateAsPem(assertIsDefined(env.get("REFRESH_PK"))); // In for ECDSA384, as single line string, without /n and PEM headers
const REFRESH_PUB = derivePublicKey(assertIsDefined(REFRESH_PK));

function formatPrivateAsPem(key: string): string {
  const formattedKey = key.match(/.{1,64}/g)?.join("\n") ?? key;
  return `-----BEGIN EC PRIVATE KEY-----\n${formattedKey}\n-----END EC PRIVATE KEY-----`;
}

function derivePublicKey(privateKey: string): string {
  return createPublicKey(privateKey)
    .export({ format: "pem", type: "spki" })
    .toString();
}

function assertIsDefined<T>(value: T | undefined): T {
  assert(value !== undefined);
  return value;
}

interface SupportedPayload {
  iss: string;
  sub: number;
  aud: string;
  exp: number;
  iat: number;
  isRefresh: boolean;
}

interface RefreshTokenPayload extends SupportedPayload {
  isRefresh: true;
  tokenId: UUID;
}

export class JwtGuard implements GuardContract<User> {
  #ctx: HttpContext;

  constructor(ctx: HttpContext) {
    this.#ctx = ctx;
  }

  user?: User;

  isAuthenticated = false;

  authenticationAttempted = false;

  driverName = JWT_GUARD;

  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  private generateAccessToken(userId: number): string {
    return jwt.sign(
      {
        isRefresh: false,
      },
      ACCESS_SECRET,
      {
        subject: userId.toString(),
        audience: AUDIENCE,
        issuer: ISSUER,
        expiresIn: ACCESS_EXPIRES_IN_MS,
        algorithm: "HS256",
        allowInsecureKeySizes: false,
        allowInvalidAsymmetricKeyTypes: false,
      },
    );
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const dbToken = new RefreshToken();
    dbToken.forUserId = userId;
    dbToken.expiresAt = DateTime.now().plus(
      Duration.fromMillis(REFRESH_EXPIRES_IN_MS),
    );
    dbToken.isValid = true;
    dbToken.id = randomUUID();
    const payload = jwt.sign(
      {
        tokenId: dbToken.id,
        isRefresh: true,
      },
      REFRESH_PK,
      {
        subject: userId.toString(),
        audience: AUDIENCE,
        issuer: ISSUER,
        expiresIn: REFRESH_EXPIRES_IN_MS,
        algorithm: "ES384",
        allowInsecureKeySizes: false,
        allowInvalidAsymmetricKeyTypes: false,
      },
    );
    await dbToken.save();
    return payload;
  }

  private validateAccessToken(token: string): SupportedPayload {
    return jwt.verify(token, ACCESS_SECRET, {
      audience: AUDIENCE,
      issuer: ISSUER,
      ignoreExpiration: false,
    }) as unknown as SupportedPayload;
  }

  private async validateRefreshToken(
    withDb: boolean,
    token: string,
  ): Promise<RefreshTokenPayload> {
    const payload = jwt.verify(token, REFRESH_PUB, {
      audience: AUDIENCE,
      issuer: ISSUER,
      allowInvalidAsymmetricKeyTypes: false,
      ignoreExpiration: false,
    }) as unknown as RefreshTokenPayload;
    if (!withDb) {
      return payload;
    }
    const isValid = await RefreshToken.isTokenValid(
      payload.tokenId,
      payload.sub,
    );
    if (!isValid) {
      this.throw403();
    }
    return payload;
  }

  public async generateOnLogin(user: User): Promise<JwtTokenResponse> {
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    return {
      type: "bearer",
      accessToken,
      refreshToken,
      accessExpiresInMs: ACCESS_EXPIRES_IN_MS,
      refreshExpiresInMs: REFRESH_EXPIRES_IN_MS,
    };
  }

  private extractTokenFromHeaderOrFail(): string {
    const authHeader = this.#ctx.request.header("Authorization");
    // Exists
    if (authHeader === undefined) {
      this.throw401();
    }
    // Extract token
    if (!authHeader.startsWith("Bearer ")) {
      this.throw401();
    }
    return authHeader.substring(7);
  }

  public async authenticate(): Promise<User> {
    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }
    this.authenticationAttempted = true;
    const token = this.extractTokenFromHeaderOrFail();
    const payload = this.validateAccessToken(token);
    const owner = await User.findBy("id", payload.sub);
    if (owner === null) {
      this.throw401();
    }
    this.user = owner;
    this.isAuthenticated = true;
    return owner;
  }

  async check(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  public async refreshAccessToken(
    refreshToken: string,
  ): Promise<JwtAccessTokenResponse> {
    const payload = await this.validateRefreshToken(true, refreshToken);
    return {
      type: "bearer",
      accessToken: this.generateAccessToken(payload.sub),
      accessExpiresInMs: ACCESS_EXPIRES_IN_MS,
    };
  }

  public async invalidateRefreshToken(token: string): Promise<boolean> {
    let payload;
    try {
      payload = await this.validateRefreshToken(false, token);
    } catch {
      // Token was invalid, so positive outcome
      return true;
    }
    try {
      await RefreshToken.invalidateToken(payload.tokenId);
      return true;
    } catch (error) {
      logger.error("Failed to invalidate refresh token: ", error);
      return false;
    }
  }

  public async invalidateAllRefreshTokensForUser(
    forUserId: number,
  ): Promise<boolean> {
    try {
      await RefreshToken.invalidateAllTokensForUser(forUserId);
      return true;
    } catch (error) {
      logger.error("Failed to invalidate refresh tokens: ", error);
      return false;
    }
  }

  public getUserOrFail(): User {
    if (this.user === undefined) {
      this.throw403();
    }
    return this.user;
  }

  private throw401(): never {
    throw new UnauthorizedException("Authentication required");
  }

  private throw403(): never {
    throw new ForbiddenException("Invalid token");
  }

  /** This is required for the interface contract, but until a use case is found,
   *  it is best for it to remain unsupported.
   */
  async authenticateAsClient(_: User): Promise<AuthClientResponse> {
    throw new Error(
      "Unsupported operation. Use `generateOnLogin` instead to get a token pair.",
    );
  }
}
