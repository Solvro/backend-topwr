import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import Contributor from "#models/contributor";
import Milestone from "#models/milestone";
import Role from "#models/role";
import User from "#models/user";
import env from "#start/env";

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@order.test`;
}

async function makeToken(user: User): Promise<string> {
  const ACCESS_SECRET = env.get("ACCESS_SECRET");
  const AUDIENCE = "admin.topwr.solvro.pl";
  const ISSUER = "admin.topwr.solvro.pl";
  const ACCESS_EXPIRES_IN_MS = Number.parseInt(
    env.get("ACCESS_EXPIRES_IN_MS", "3600000"),
  );

  return jwt.sign({ isRefresh: false }, ACCESS_SECRET, {
    subject: user.id.toString(),
    audience: AUDIENCE,
    issuer: ISSUER,
    expiresIn: ACCESS_EXPIRES_IN_MS,
    algorithm: "HS256",
    allowInsecureKeySizes: false,
    allowInvalidAsymmetricKeyTypes: false,
  });
}

async function ensureSolvroAdminRoleId(): Promise<number> {
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

async function assignSolvroAdmin(user: User): Promise<void> {
  const roleId = await ensureSolvroAdminRoleId();
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

async function adminAuthHeader(): Promise<string> {
  const admin = await User.create({
    email: uniqueEmail("order-admin"),
    password: "Passw0rd!",
    fullName: "Order Test Admin",
  });
  await assignSolvroAdmin(admin);
  return `Bearer ${await makeToken(admin)}`;
}

test.group("Contributor per-milestone order", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("GET /contributors does not include order field", async ({
    client,
    assert,
  }) => {
    await Contributor.create({ name: "OrderTest Alice" });

    const res = await client.get("/api/v1/contributors");
    res.assertStatus(200);
    const body = res.body() as { data: Record<string, unknown>[] };
    const contributor = body.data.find((c) => c.name === "OrderTest Alice");
    assert.exists(contributor);
    assert.notProperty(contributor ?? {}, "order");
  });

  test("GET /milestones/:id/contributors returns pivot_order and is sorted asc", async ({
    client,
    assert,
  }) => {
    const role = await Role.create({ name: "OrderTest Role" });
    const c1 = await Contributor.create({ name: "OrderTest Bob" });
    const c2 = await Contributor.create({ name: "OrderTest Carol" });
    const c3 = await Contributor.create({ name: "OrderTest Dave" });
    const milestone = await Milestone.create({ name: "OrderTest Milestone A" });

    await db
      .knexQuery()
      .table("contributor_roles")
      .insert([
        {
          contributor_id: c1.id,
          role_id: role.id,
          milestone_id: milestone.id,
          order: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c2.id,
          role_id: role.id,
          milestone_id: milestone.id,
          order: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c3.id,
          role_id: role.id,
          milestone_id: milestone.id,
          order: 7,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

    const res = await client.get(
      `/api/v1/milestones/${milestone.id}/contributors`,
    );
    res.assertStatus(200);
    const body = res.body() as {
      data: { id: number; meta: { pivot_order: number } }[];
    };
    const ids = body.data.map((c) => c.id);
    assert.deepEqual(ids, [c2.id, c3.id, c1.id]);
    assert.property(body.data[0].meta, "pivot_order");
    assert.equal(body.data[0].meta.pivot_order, 5);
    assert.equal(body.data[1].meta.pivot_order, 7);
    assert.equal(body.data[2].meta.pivot_order, 10);
  });

  test("order is independent per milestone", async ({ client, assert }) => {
    const role = await Role.create({ name: "OrderTest Role 2" });
    const c1 = await Contributor.create({ name: "OrderTest Eve" });
    const c2 = await Contributor.create({ name: "OrderTest Frank" });
    const m1 = await Milestone.create({ name: "OrderTest Milestone B" });
    const m2 = await Milestone.create({ name: "OrderTest Milestone C" });

    await db
      .knexQuery()
      .table("contributor_roles")
      .insert([
        {
          contributor_id: c1.id,
          role_id: role.id,
          milestone_id: m1.id,
          order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c2.id,
          role_id: role.id,
          milestone_id: m1.id,
          order: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c1.id,
          role_id: role.id,
          milestone_id: m2.id,
          order: 99,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c2.id,
          role_id: role.id,
          milestone_id: m2.id,
          order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

    const resM1 = await client.get(`/api/v1/milestones/${m1.id}/contributors`);
    resM1.assertStatus(200);
    const bodyM1 = resM1.body() as { data: { id: number }[] };
    assert.deepEqual(
      bodyM1.data.map((c) => c.id),
      [c1.id, c2.id],
    );

    const resM2 = await client.get(`/api/v1/milestones/${m2.id}/contributors`);
    resM2.assertStatus(200);
    const bodyM2 = resM2.body() as { data: { id: number }[] };
    assert.deepEqual(
      bodyM2.data.map((c) => c.id),
      [c2.id, c1.id],
    );
  });

  test("trigger auto-assigns order per milestone when not provided", async ({
    assert,
  }) => {
    const role = await Role.create({ name: "OrderTest Role 3" });
    const c1 = await Contributor.create({ name: "OrderTest Grace" });
    const c2 = await Contributor.create({ name: "OrderTest Heidi" });
    const milestone = await Milestone.create({ name: "OrderTest Milestone D" });

    await db.knexQuery().table("contributor_roles").insert({
      contributor_id: c1.id,
      role_id: role.id,
      milestone_id: milestone.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await db.knexQuery().table("contributor_roles").insert({
      contributor_id: c2.id,
      role_id: role.id,
      milestone_id: milestone.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const rows = (await db
      .knexQuery()
      .table("contributor_roles")
      .where("milestone_id", milestone.id)
      .orderBy("order")) as { contributor_id: number; order: number }[];

    assert.lengthOf(rows, 2);
    assert.equal(rows[0].contributor_id, c1.id);
    assert.equal(rows[0].order, 1);
    assert.equal(rows[1].contributor_id, c2.id);
    assert.equal(rows[1].order, 2);
  });

  test("a contributor can only have one role per milestone", async ({
    assert,
  }) => {
    const role1 = await Role.create({ name: "OrderTest Role 4a" });
    const role2 = await Role.create({ name: "OrderTest Role 4b" });
    const contributor = await Contributor.create({
      name: "OrderTest Ivan",
    });
    const milestone = await Milestone.create({ name: "OrderTest Milestone E" });

    await db.knexQuery().table("contributor_roles").insert({
      contributor_id: contributor.id,
      role_id: role1.id,
      milestone_id: milestone.id,
      order: 3,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // A second role for the same (contributor, milestone) violates the
    // unique constraint and must be rejected.
    await assert.rejects(async () => {
      await db.knexQuery().table("contributor_roles").insert({
        contributor_id: contributor.id,
        role_id: role2.id,
        milestone_id: milestone.id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    const rows = (await db.knexQuery().table("contributor_roles").where({
      contributor_id: contributor.id,
      milestone_id: milestone.id,
    })) as { role_id: number; order: number }[];

    assert.lengthOf(rows, 1);
    assert.equal(rows[0].role_id, role1.id);
  });

  test("PATCH /milestones/:id/contributors/:contributorId updates pivot order", async ({
    client,
    assert,
  }) => {
    const auth = await adminAuthHeader();
    const role = await Role.create({ name: "OrderTest Role PATCH" });
    const c1 = await Contributor.create({ name: "OrderTest Patch A" });
    const c2 = await Contributor.create({ name: "OrderTest Patch B" });
    const milestone = await Milestone.create({
      name: "OrderTest Milestone PATCH",
    });

    await db
      .knexQuery()
      .table("contributor_roles")
      .insert([
        {
          contributor_id: c1.id,
          role_id: role.id,
          milestone_id: milestone.id,
          order: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          contributor_id: c2.id,
          role_id: role.id,
          milestone_id: milestone.id,
          order: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

    const patchRes = await client
      .patch(`/api/v1/milestones/${milestone.id}/contributors/${c1.id}`)
      .header("Authorization", auth)
      .json({ role_id: role.id, order: 1 });
    patchRes.assertStatus(200);
    const patchBody = patchRes.body() as { success?: boolean };
    assert.equal(patchBody.success, true);

    const res = await client.get(
      `/api/v1/milestones/${milestone.id}/contributors`,
    );
    res.assertStatus(200);
    const body = res.body() as {
      data: { id: number; meta: { pivot_order: number } }[];
    };
    assert.deepEqual(
      body.data.map((c) => c.id),
      [c1.id, c2.id],
    );
    assert.equal(body.data[0].meta.pivot_order, 1);
    assert.equal(body.data[1].meta.pivot_order, 5);
  });

  test("PATCH pivot update returns 404 when no row matches", async ({
    client,
  }) => {
    const auth = await adminAuthHeader();
    const role = await Role.create({ name: "OrderTest Role PATCH 404" });
    const contributor = await Contributor.create({
      name: "OrderTest Patch 404",
    });
    const milestone = await Milestone.create({
      name: "OrderTest Milestone PATCH 404",
    });

    const res = await client
      .patch(
        `/api/v1/milestones/${milestone.id}/contributors/${contributor.id}`,
      )
      .header("Authorization", auth)
      .json({ role_id: role.id, order: 1 });
    res.assertStatus(404);
  });

  test("PATCH pivot update validates required pivot key and updatable fields", async ({
    client,
  }) => {
    const auth = await adminAuthHeader();
    const role = await Role.create({ name: "OrderTest Role PATCH 422" });
    const contributor = await Contributor.create({
      name: "OrderTest Patch 422",
    });
    const milestone = await Milestone.create({
      name: "OrderTest Milestone PATCH 422",
    });

    await db.knexQuery().table("contributor_roles").insert({
      contributor_id: contributor.id,
      role_id: role.id,
      milestone_id: milestone.id,
      order: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const missingRole = await client
      .patch(
        `/api/v1/milestones/${milestone.id}/contributors/${contributor.id}`,
      )
      .header("Authorization", auth)
      .json({ order: 2 });
    missingRole.assertStatus(422);

    const missingOrder = await client
      .patch(
        `/api/v1/milestones/${milestone.id}/contributors/${contributor.id}`,
      )
      .header("Authorization", auth)
      .json({ role_id: role.id });
    missingOrder.assertStatus(400);
  });
});
