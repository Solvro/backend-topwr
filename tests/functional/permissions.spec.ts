import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import Library from "#models/library";
import User from "#models/user";

async function makeToken(user: User) {
  const token = await User.accessTokens.create(user, [], {
    expiresIn: "1 day",
  });
  if (!token.value) throw new Error("Token value missing");
  return token.value.release();
}

async function ensureSolvroAdminRoleId(): Promise<number> {
  // Ensure 'solvro_admin' exists in access_roles and return its id
  const role = await db
    .knexQuery()
    .table("access_roles")
    .where({ slug: "solvro_admin" })
    .first();
  if (role) return Number(role.id);
  const inserted = await db
    .knexQuery()
    .table("access_roles")
    .insert({
      slug: "solvro_admin",
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("id");
  const id = Array.isArray(inserted)
    ? ((inserted as any)[0]?.id ?? inserted[0])
    : (inserted as any);
  return Number(id);
}

async function assignSolvroAdmin(user: User) {
  const roleId = await ensureSolvroAdminRoleId();
  // model_roles: model_type, model_id, role_id
  const existing = await db
    .knexQuery()
    .table("model_roles")
    .where({ model_type: "users", model_id: user.id, role_id: roleId })
    .first();
  if (!existing) {
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
      email: `user1@perm.test`,
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
      email: `admin1@perm.test`,
      password: "Passw0rd!",
      fullName: "Solvro Admin",
    });
    await assignSolvroAdmin(adminUser);
    const token = await makeToken(adminUser);

    const res = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${token}`)
      .json({ title: "PermTest Lib 2", latitude: 11, longitude: 21 });

    res.assertStatus(200);
    assert.equal(res.body().success, true);
    assert.equal(res.body().data.title, "PermTest Lib 2");
  });

  test("update blocked without permission; allowed for solvro_admin", async ({
    client,
    assert,
  }) => {
    // Create a record as solvro_admin
    const adminUser = await User.create({
      email: `admin2@perm.test`,
      password: "Passw0rd!",
      fullName: "Solvro Admin 2",
    });
    await assignSolvroAdmin(adminUser);
    const adminToken = await makeToken(adminUser);
    const created = await client
      .post("/api/v1/libraries")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({ title: "PermTest Lib 3", latitude: 12, longitude: 22 });
    created.assertStatus(200);
    const id = created.body().data.id as number;

    // Regular user cannot update
    const user = await User.create({
      email: `user2@perm.test`,
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
    assert.equal(ok.body().data.title, "PermTest Lib 3 Updated");
  });
});
