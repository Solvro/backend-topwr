import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import StudentOrganizationDraft from "#models/student_organization_draft";
import User from "#models/user";

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@pc.test`;
}

async function makeToken(user: User) {
  const token = await User.accessTokens.create(user, [], {
    expiresIn: "1 day",
  });
  if (!token.value) throw new Error("Token value missing");
  return token.value.release();
}

async function ensureSolvroAdminRoleId(): Promise<number> {
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

test.group("PermissionsController", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });
  group.each.teardown(async () => {
    // Cleanup any users created by this spec
    await User.query().where("email", "like", "%@pc.test").delete();
  });

  test("non-admin cannot call allow", async ({ client }) => {
    const user = await User.create({
      email: uniqueEmail("pc1"),
      password: "Passw0rd!",
      fullName: "U",
    });
    const token = await makeToken(user);

    const resp = await client
      .post("/api/v1/permissions/allow")
      .header("Authorization", `Bearer ${token}`)
      .json({
        userId: user.id,
        action: "read",
        resource: { type: "class", name: "student_organization_drafts" },
      });
    resp.assertStatus(403);
  });

  test("admin can grant class-level read on drafts", async ({ client }) => {
    const admin = await User.create({
      email: uniqueEmail("pc2"),
      password: "Passw0rd!",
      fullName: "Admin",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    const target = await User.create({
      email: uniqueEmail("pc3"),
      password: "Passw0rd!",
      fullName: "Target",
    });
    const targetToken = await makeToken(target);

    const draft = await StudentOrganizationDraft.create({
      name: "PC Draft 1",
      isStrategic: false,
      coverPreview: false,
      source: "manual" as any,
      organizationType: "student_organization" as any,
      organizationStatus: "unknown" as any,
    });

    // Before: 403
    const before = await client
      .get(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${targetToken}`);
    before.assertStatus(403);

    // Grant
    const allow = await client
      .post("/api/v1/permissions/allow")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        userId: target.id,
        action: "read",
        resource: { type: "class", name: "student_organization_drafts" },
      });
    allow.assertStatus(200);

    // After: 200
    const after = await client
      .get(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${targetToken}`);
    after.assertStatus(200);
  });

  test("admin can grant and revoke model-level update on draft", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("pc4"),
      password: "Passw0rd!",
      fullName: "Admin 2",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    const target = await User.create({
      email: uniqueEmail("pc5"),
      password: "Passw0rd!",
      fullName: "Target 2",
    });
    const targetToken = await makeToken(target);

    const draft = await StudentOrganizationDraft.create({
      name: "PC Draft 2",
      isStrategic: false,
      coverPreview: false,
      source: "manual" as any,
      organizationType: "student_organization" as any,
      organizationStatus: "unknown" as any,
    });

    // Grant model-level update
    const allow = await client
      .post("/api/v1/permissions/allow")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        userId: target.id,
        action: "update",
        resource: {
          type: "model",
          name: "student_organization_drafts",
          id: draft.id,
        },
      });
    allow.assertStatus(200);

    const ok = await client
      .patch(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${targetToken}`)
      .json({ name: "PC Draft 2 Updated" });
    ok.assertStatus(200);

    // Revoke
    const revoke = await client
      .post("/api/v1/permissions/revoke")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        userId: target.id,
        action: "update",
        resource: {
          type: "model",
          name: "student_organization_drafts",
          id: draft.id,
        },
      });
    revoke.assertStatus(200);

    const bad = await client
      .patch(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${targetToken}`)
      .json({ name: "Blocked" });
    bad.assertStatus(403);
  });

  test("admin can grant class-level create for guide drafts", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("pc6"),
      password: "Passw0rd!",
      fullName: "Admin 3",
    });
    await assignSolvroAdmin(admin);
    const adminToken = await makeToken(admin);

    const target = await User.create({
      email: uniqueEmail("pc7"),
      password: "Passw0rd!",
      fullName: "Target 3",
    });
    const targetToken = await makeToken(target);

    const allow = await client
      .post("/api/v1/permissions/allow")
      .header("Authorization", `Bearer ${adminToken}`)
      .json({
        userId: target.id,
        action: "create",
        resource: { type: "class", name: "guide_article_drafts" },
      });
    allow.assertStatus(200);

    const ok = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${targetToken}`)
      .json({
        title: "PCTest GAD",
        shortDesc: "S",
        description: "D",
        imageKey: null,
      });
    ok.assertStatus(200);
  });
});
