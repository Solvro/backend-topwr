import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import { Branch } from "#enums/branch";
import { Weekday } from "#enums/weekday";
import Contributor from "#models/contributor";
import Library from "#models/library";
import Milestone from "#models/milestone";
import Role from "#models/role";
import User from "#models/user";
import env from "#start/env";

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@perm.test`;
}

async function makeToken(user: User): Promise<string> {
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

async function ensureSolvroAdminRoleId(): Promise<number> {
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
        return Number(first as number | string);
      }
      if (typeof result === "object" && result !== null && "id" in result) {
        return Number((result as { id: number | string }).id);
      }
      return Number(result as number | string);
    });

  return idNum;
}

async function assignSolvroAdmin(user: User) {
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

test.group("Permissions", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });
  group.each.teardown(async () => {
    // Light cleanup for test-created users and libraries
    await User.query().where("email", "like", "%@perm.test").delete();
    await Library.query().where("title", "like", "PermTest %").delete();
  });

  test("index is public", async ({ client, assert }) => {
    const res = await client.get("/api/v1/libraries");
    res.assertStatus(200);
    assert.property(res.body(), "data");
  });

  test("store requires permission: regular user gets 403", async ({
    client,
  }) => {
    const user = await User.create({
      email: uniqueEmail("user1"),
      password: "Passw0rd!",
      fullName: "Perm User 1",
    });
    const token = await makeToken(user);

    const res = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${token}`)
      .json({ title: "PermTest Lib 1", latitude: 10, longitude: 20 });

    res.assertStatus(403);
  });

  test("solvro_admin bypass: can store", async ({ client, assert }) => {
    const adminUser = await User.create({
      email: uniqueEmail("admin1"),
      password: "Passw0rd!",
      fullName: "Solvro Admin",
    });
    await assignSolvroAdmin(adminUser);
    const token = await makeToken(adminUser);

    const res = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${token}`)
      .json({
        title: "PermTest Lib 2",
        latitude: 11,
        longitude: 21,
        branch: Branch.Main,
      });

    res.assertStatus(200);
    const body = res.body() as unknown as {
      success?: boolean;
      data?: { title?: string };
    };
    assert.equal(body.success, true);
    assert.equal(body.data?.title, "PermTest Lib 2");
  });

  test("update blocked without permission; allowed for solvro_admin", async ({
    client,
    assert,
  }) => {
    // Create a record as solvro_admin
    const adminUser = await User.create({
      email: uniqueEmail("admin2"),
      password: "Passw0rd!",
      fullName: "Solvro Admin 2",
    });
    await assignSolvroAdmin(adminUser);
    const adminToken = await makeToken(adminUser);
    const created = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        title: "PermTest Lib 3",
        latitude: 12,
        longitude: 22,
        branch: Branch.Main,
      });
    created.assertStatus(200);
    const bodyC = created.body() as unknown as { data?: { id?: number } };
    const id = Number(bodyC.data?.id);

    // Regular user cannot update
    const user = await User.create({
      email: uniqueEmail("user2"),
      password: "Passw0rd!",
      fullName: "Perm User 2",
    });
    const userToken = await makeToken(user);
    const bad = await client
      .patch(`/api/v1/libraries/${id}`)
      .header("Authorization", `Bearer ${userToken}`)
      .json({ title: "Blocked" });
    bad.assertStatus(403);

    // Admin can update
    const ok = await client
      .patch(`/api/v1/libraries/${id}`)
      .header("Authorization", `Bearer ${adminToken}`)
      .json({ title: "PermTest Lib 3 Updated" });
    ok.assertStatus(200);
    const bodyOk = ok.body() as unknown as { data?: { title?: string } };
    assert.equal(bodyOk.data?.title, "PermTest Lib 3 Updated");
  });

  test("relationIndex is public; 1:N relation store requires permission", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin3"),
      password: "Passw0rd!",
      fullName: "Solvro Admin 3",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    const created = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        title: "PermTest Lib 4",
        latitude: 13,
        longitude: 23,
        branch: Branch.Main,
      });
    created.assertStatus(200);
    const cBody = created.body() as unknown as { data?: { id?: number } };
    const libId = Number(cBody.data?.id);

    // relationIndex should be public
    const ri = await client.get(`/api/v1/libraries/${libId}/regular_hours`);
    ri.assertStatus(200);
    assert.property(ri.body(), "data");

    // Regular user cannot create related
    const user = await User.create({
      email: uniqueEmail("user3"),
      password: "Passw0rd!",
      fullName: "Perm User 3",
    });
    const userToken = await makeToken(user);
    const badStore = await client
      .post(`/api/v1/libraries/${libId}/regular_hours`)
      .header("Authorization", `Bearer ${userToken}`)
      .json({ weekDay: Weekday.Monday, openTime: "08:00", closeTime: "16:00" });
    badStore.assertStatus(403);

    // Admin can create related
    const okStore = await client
      .post(`/api/v1/libraries/${libId}/regular_hours`)
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        weekDay: Weekday.Tuesday,
        openTime: "09:00",
        closeTime: "17:00",
      });
    okStore.assertStatus(200);
    const okBody = okStore.body() as unknown as {
      success?: boolean;
      data?: { libraryId?: number };
    };
    assert.equal(okBody.success, true);
    assert.equal(okBody.data?.libraryId, libId);
  });

  test("many-to-many attach/detach require permission; solvro_admin bypass works", async ({
    client,
    assert,
  }) => {
    const role = await Role.create({ name: "PermTest Role" });
    const person = await Contributor.create({ name: "PermTest Contributor" });
    const milestone = await Milestone.create({ name: "PermTest Milestone" });

    const user = await User.create({
      email: uniqueEmail("user4"),
      password: "Passw0rd!",
      fullName: "Perm User 4",
    });
    const userToken = await makeToken(user);

    const admin = await User.create({
      email: uniqueEmail("admin4"),
      password: "Passw0rd!",
      fullName: "Solvro Admin 4",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    // Regular user cannot attach
    const badAttach = await client
      .post(`/api/v1/roles/${role.id}/contributors/${person.id}`)
      .header("Authorization", `Bearer ${userToken}`)
      .json({});
    badAttach.assertStatus(403);

    // Admin can attach
    const okAttach = await client
      .post(`/api/v1/roles/${role.id}/contributors/${person.id}`)
      .header("Authorization", `Bearer ${adminToken}`)
      .json({ milestone_id: milestone.id });
    okAttach.assertStatus(200);
    const okAttachBody = okAttach.body() as unknown as { success?: boolean };
    assert.equal(okAttachBody.success, true);

    // Regular user cannot detach
    const badDetach = await client
      .delete(`/api/v1/roles/${role.id}/contributors/${person.id}`)
      .header("Authorization", `Bearer ${userToken}`)
      .json({});
    badDetach.assertStatus(403);

    // Admin can detach
    const okDetach = await client
      .delete(`/api/v1/roles/${role.id}/contributors/${person.id}`)
      .header("Authorization", `Bearer ${adminToken}`)
      .json({});
    okDetach.assertStatus(200);
    const okDetachBody = okDetach.body() as unknown as { success?: boolean };
    assert.equal(okDetachBody.success, true);
  });

  test("destroy blocked without permission; allowed for solvro_admin", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin5"),
      password: "Passw0rd!",
      fullName: "Solvro Admin 5",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    const created = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        title: "PermTest Lib 5",
        latitude: 15,
        longitude: 25,
        branch: Branch.Main,
      });
    created.assertStatus(200);
    const cBody = created.body() as unknown as { data?: { id?: number } };
    const id = Number(cBody.data?.id);

    // Regular user cannot delete
    const user = await User.create({
      email: uniqueEmail("user5"),
      password: "Passw0rd!",
      fullName: "Perm User 5",
    });
    const userToken = await makeToken(user);
    const bad = await client
      .delete(`/api/v1/libraries/${id}`)
      .header("Authorization", `Bearer ${userToken}`);
    bad.assertStatus(403);

    // Admin can delete
    const ok = await client
      .delete(`/api/v1/libraries/${id}`)
      .header("Authorization", `Bearer ${adminToken}`);
    ok.assertStatus(200);
  });
});
