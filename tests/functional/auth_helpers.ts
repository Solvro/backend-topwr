import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import db from "@adonisjs/lucid/services/db";

import User from "#models/user";
import env from "#start/env";

export function uniqueEmail(prefix: string): string {
  const id = crypto.randomBytes(4).toString("hex");
  return `${prefix}-${id}@example.test`;
}

export async function makeToken(user: User): Promise<string> {
  const ACCESS_SECRET = env.get("ACCESS_SECRET");
  const AUDIENCE = "admin.topwr.solvro.pl";
  const ISSUER = "admin.topwr.solvro.pl";
  const ACCESS_EXPIRES_IN_MS = Number.parseInt(
    env.get("ACCESS_EXPIRES_IN_MS", "3600000"),
  );

  return jwt.sign(
    {
      isRefresh: false,
    },
    ACCESS_SECRET,
    {
      subject: user.id.toString(),
      audience: AUDIENCE,
      issuer: ISSUER,
      expiresIn: ACCESS_EXPIRES_IN_MS,
      algorithm: "HS256",
      allowInsecureKeySizes: false,
      allowInvalidAsymmetricKeyTypes: false,
    },
  );
}

export async function ensureSolvroAdminRoleId(): Promise<number> {
  // Ensure 'solvro_admin' exists in access_roles and return its id
  const existing: unknown = await db
    .knexQuery()
    .table("access_roles")
    .where({ slug: "solvro_admin" })
    .first();
  if (existing !== null && existing !== undefined) {
    return Number((existing as { id: number | string }).id);
  }

  const idNum = await db
    .knexQuery()
    .table("access_roles")
    .insert({
      slug: "solvro_admin",
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("id")
    .then((result: unknown) => {
      if (Array.isArray(result)) {
        const first = result[0] as unknown;
        if (typeof first === "object" && first !== null && "id" in first) {
          return Number((first as { id: number | string }).id);
        }
        return Number(first);
      }
      if (typeof result === "object" && result !== null && "id" in result) {
        return Number((result as { id: number | string }).id);
      }
      return Number(result);
    });

  return idNum;
}

export async function assignSolvroAdmin(user: User) {
  const roleId = await ensureSolvroAdminRoleId();
  // model_roles: model_type, model_id, role_id
  const existing: unknown = await db
    .knexQuery()
    .table("model_roles")
    .where({ model_type: "users", model_id: user.id, role_id: roleId })
    .first();
  if (existing === null || existing === undefined) {
    await db.knexQuery().table("model_roles").insert({
      model_type: "users",
      model_id: user.id,
      role_id: roleId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

export async function createUserWithToken(
  prefix: string,
  fullName: string,
): Promise<{ user: User; token: string; password: string }> {
  const password = `Test-${crypto.randomBytes(16).toString("hex")}!`;
  const user = await User.create({
    email: uniqueEmail(prefix),
    password,
    fullName,
  });
  const token = await makeToken(user);
  return { user, token, password };
}

export async function createAdminWithToken(
  prefix: string,
  fullName: string,
): Promise<{ user: User; token: string; password: string }> {
  const password = `Test-${crypto.randomBytes(16).toString("hex")}!`;
  const user = await User.create({
    email: uniqueEmail(prefix),
    password,
    fullName,
  });
  await assignSolvroAdmin(user);
  const token = await makeToken(user);
  return { user, token, password };
}
