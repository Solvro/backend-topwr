import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import Contributor from "#models/contributor";
import Milestone from "#models/milestone";
import Role from "#models/role";

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

  test("trigger reuses order for same contributor+milestone with different role", async ({
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
    await db.knexQuery().table("contributor_roles").insert({
      contributor_id: contributor.id,
      role_id: role2.id,
      milestone_id: milestone.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const rows = (await db
      .knexQuery()
      .table("contributor_roles")
      .where({
        contributor_id: contributor.id,
        milestone_id: milestone.id,
      })
      .orderBy("role_id")) as { role_id: number; order: number }[];

    assert.lengthOf(rows, 2);
    assert.equal(rows[0].order, 3);
    assert.equal(rows[1].order, 3);
  });
});
