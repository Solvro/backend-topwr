import { symbols } from "@adonisjs/auth";

import type { JwtGuardUser, JwtUserProviderContract } from "./guards/jwt.js";

interface UserWithId {
  id: string | number | bigint;
}

/**
 * The bridge between the User provider and the
 * Guard
 */
export class JwtLucidUser<RealUser extends UserWithId>
  implements JwtGuardUser<RealUser>
{
  private user: RealUser;

  constructor(user: RealUser) {
    this.user = user;
  }

  getId(): string | number | bigint {
    return this.user.id;
  }

  getOriginal(): RealUser {
    return this.user;
  }
}

interface UserModel {
  findBy(column: string, value: string | number): Promise<UserWithId | null>;
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export class JwtLucidUserProvider<RealUser extends UserWithId>
  implements JwtUserProviderContract<RealUser>
{
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  declare [symbols.PROVIDER_REAL_USER]: RealUser;

  private userModel: UserModel;

  constructor(userModel: UserModel) {
    this.userModel = userModel;
  }

  async createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>> {
    return new JwtLucidUser(user);
  }

  async findById(id: string | number): Promise<JwtGuardUser<RealUser> | null> {
    const user = await this.userModel.findBy("id", id);
    if (user === null) {
      return null;
    }

    return new JwtLucidUser(user as RealUser);
  }
}

interface ModelImport {
  default?: UserModel;
  [key: string]: unknown;
}

export function jwtUserProvider(config: { model: () => Promise<ModelImport> }) {
  return {
    async createInstance() {
      const userModel = await config.model();
      const model = userModel.default ?? userModel;
      return new JwtLucidUserProvider(model as UserModel);
    },
  };
}
