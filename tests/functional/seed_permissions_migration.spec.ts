import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

const EXPECTED_PERMISSIONS = [
  "create",
  "update",
  "read",
  "destroy",
  "approve_draft",
];

const EXPECTED_ROLES = ["admin", "solvro_admin"];

test.group("Seed permissions migration", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("all expected permissions are seeded", async ({ assert }) => {
    const rows = (await db.knexQuery().table("permissions").select("slug")) as {
      slug: string;
    }[];

    const slugs = rows.map((r) => r.slug);
    for (const expected of EXPECTED_PERMISSIONS) {
      assert.include(slugs, expected);
    }
  });

  test("all expected roles are seeded", async ({ assert }) => {
    const rows = (await db
      .knexQuery()
      .table("access_roles")
      .select("slug")) as { slug: string }[];

    const slugs = rows.map((r) => r.slug);
    for (const expected of EXPECTED_ROLES) {
      assert.include(slugs, expected);
    }
  });
});
