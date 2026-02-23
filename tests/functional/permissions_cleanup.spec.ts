import { Acl } from "@holoyan/adonisjs-permissions";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import { Branch } from "#enums/branch";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import StudentOrganizationDraft from "#models/student_organization_draft";
import User from "#models/user";
import env from "#start/env";
import {
  deleteOrphanedPermissionsForModel,
  deletePermissionsForEntity,
} from "#utils/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@cleanup.test`;
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

async function countPermissionsFor(
  entityType: string,
  entityId: number,
): Promise<number> {
  const result = (await db
    .knexQuery()
    .table("permissions")
    .where({ entity_type: entityType, entity_id: entityId })
    .count("* as count")
    .first()) as { count: number | string } | undefined;
  return Number(result?.count ?? 0);
}

async function insertPermissionRow(
  entityType: string,
  entityId: number,
  slug = "read",
): Promise<void> {
  await db.knexQuery().table("permissions").insert({
    slug,
    entity_type: entityType,
    entity_id: entityId,
    scope: "default",
    allowed: true,
    created_at: new Date(),
    updated_at: new Date(),
  });
}

async function ensureSolvroAdminRoleId(): Promise<number> {
  const existing = (await db
    .knexQuery()
    .table("access_roles")
    .where({ slug: "solvro_admin" })
    .first()) as { id: number | string } | undefined | null;
  if (existing !== null && existing !== undefined) {
    return Number(existing.id);
  }
  const result = await db
    .knexQuery()
    .table("access_roles")
    .insert({
      slug: "solvro_admin",
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("id");
  const first = (result as unknown[])[0];
  if (typeof first === "object" && first !== null && "id" in first) {
    return Number((first as { id: number | string }).id);
  }
  return Number(first as number | string);
}

async function assignSolvroAdmin(user: User): Promise<void> {
  const roleId = await ensureSolvroAdminRoleId();
  const exists = await db
    .knexQuery()
    .table("model_roles")
    .where({ model_type: "users", model_id: user.id, role_id: roleId })
    .first()
    .then((row: unknown) => row !== null && row !== undefined);
  if (!exists) {
    await db.knexQuery().table("model_roles").insert({
      model_type: "users",
      model_id: user.id,
      role_id: roleId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

async function createBaseDraft(
  userId: number,
): Promise<StudentOrganizationDraft> {
  return StudentOrganizationDraft.create({
    name: `Cleanup Test Org ${crypto.randomUUID().slice(0, 6)}`,
    isStrategic: false,
    coverPreview: false,
    source: OrganizationSource.Manual,
    organizationType: OrganizationType.StudentOrganization,
    organizationStatus: OrganizationStatus.Active,
    branch: Branch.Main,
    createdByUserId: userId,
  });
}

// ---------------------------------------------------------------------------
// Group 1 – deletePermissionsForEntity utility
// ---------------------------------------------------------------------------

test.group("deletePermissionsForEntity", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("deletes permission rows matching entity_type and entity_id", async ({
    assert,
  }) => {
    await insertPermissionRow("student_organization_drafts", 1001, "read");
    await insertPermissionRow("student_organization_drafts", 1001, "update");

    const before = await countPermissionsFor(
      "student_organization_drafts",
      1001,
    );
    assert.equal(before, 2);

    const deleted = await deletePermissionsForEntity(
      "student_organization_drafts",
      1001,
    );
    assert.equal(deleted, 2);

    const after = await countPermissionsFor(
      "student_organization_drafts",
      1001,
    );
    assert.equal(after, 0);
  });

  test("does not delete permissions for a different entity_id", async ({
    assert,
  }) => {
    await insertPermissionRow("student_organization_drafts", 2001, "read");
    await insertPermissionRow("student_organization_drafts", 2002, "read");

    await deletePermissionsForEntity("student_organization_drafts", 2001);

    const remaining = await countPermissionsFor(
      "student_organization_drafts",
      2002,
    );
    assert.equal(remaining, 1);
  });

  test("returns 0 and does not throw when no rows match", async ({
    assert,
  }) => {
    const deleted = await deletePermissionsForEntity(
      "student_organization_drafts",
      9999999,
    );
    assert.equal(deleted, 0);
  });

  test("does not delete permissions for a different entity_type", async ({
    assert,
  }) => {
    await insertPermissionRow("student_organizations", 3001, "read");
    await insertPermissionRow("student_organization_drafts", 3001, "read");

    await deletePermissionsForEntity("student_organizations", 3001);

    // The draft permission for the same id must survive
    const remaining = await countPermissionsFor(
      "student_organization_drafts",
      3001,
    );
    assert.equal(remaining, 1);
  });
});

// ---------------------------------------------------------------------------
// Group 2 – deleteOrphanedPermissionsForModel utility
// ---------------------------------------------------------------------------

test.group("deleteOrphanedPermissionsForModel", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("deletes only permissions whose entity_id no longer exists in the model table", async ({
    assert,
  }) => {
    const user = await User.create({
      email: uniqueEmail("orphan1"),
      password: "Passw0rd!",
      fullName: "Orphan Test User",
    });

    const draft = await createBaseDraft(user.id);
    const orphanId = 888888; // does not exist in DB

    // Clean up any stale rows for these IDs that may have leaked from other tests
    await db
      .knexQuery()
      .table("permissions")
      .where("entity_type", "student_organization_drafts")
      .whereIn("entity_id", [draft.id, orphanId])
      .delete();

    await insertPermissionRow("student_organization_drafts", draft.id, "read");
    await insertPermissionRow(
      "student_organization_drafts",
      orphanId,
      "update",
    );

    await deleteOrphanedPermissionsForModel(StudentOrganizationDraft);

    // The permission for the existing draft must remain
    const validRemaining = await countPermissionsFor(
      "student_organization_drafts",
      draft.id,
    );
    assert.equal(validRemaining, 1, "valid permission should not be deleted");

    // The orphan must be gone
    const orphanRemaining = await countPermissionsFor(
      "student_organization_drafts",
      orphanId,
    );
    assert.equal(orphanRemaining, 0, "orphaned permission should be deleted");
  });

  test("returns 0 when there are no orphaned permissions", async ({
    assert,
  }) => {
    const user = await User.create({
      email: uniqueEmail("orphan2"),
      password: "Passw0rd!",
      fullName: "Orphan Test User 2",
    });

    const draft = await createBaseDraft(user.id);

    // Clean up any stale orphan rows from other tests
    await db
      .knexQuery()
      .table("permissions")
      .where("entity_type", "student_organization_drafts")
      .whereNot("entity_id", draft.id)
      .whereNotNull("entity_id")
      .delete();

    await insertPermissionRow("student_organization_drafts", draft.id, "read");

    const deleted = await deleteOrphanedPermissionsForModel(
      StudentOrganizationDraft,
    );
    assert.equal(deleted, 0);
  });

  test("returns 0 for a model without a MorphMap (no ACL)", async ({
    assert,
  }) => {
    const { default: Library } = await import("#models/library");
    const deleted = await deleteOrphanedPermissionsForModel(Library);
    assert.equal(deleted, 0);
  });
});

// ---------------------------------------------------------------------------
// Group 3 – Base controller destroy() auto-cleans instance-scoped permissions
// ---------------------------------------------------------------------------

test.group("BaseController.destroy() auto-cleanup", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("deletes instance-scoped permissions when a record is destroyed via API", async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: uniqueEmail("destroycleanup1"),
      password: "Passw0rd!",
      fullName: "Destroy Cleanup User",
    });
    await user.refresh();
    const token = await makeToken(user);

    const draft = await createBaseDraft(user.id);

    // Grant instance-level permissions so:
    //  a) the user can actually call destroy (GenericDraftController checks destroy permission)
    //  b) we have something to clean up — grant read too
    await Acl.model(user).allow("read", draft);
    await Acl.model(user).allow("update", draft);
    await Acl.model(user).allow("destroy", draft);

    // Verify permissions were created (entity_id = draft.id)
    const before = await countPermissionsFor(
      "student_organization_drafts",
      draft.id,
    );
    assert.isAbove(
      before,
      0,
      "should have at least one permission before delete",
    );

    // Delete the draft via the API
    const res = await client
      .delete(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${token}`);
    res.assertStatus(200);

    // All instance-scoped permissions for this draft must be gone
    const after = await countPermissionsFor(
      "student_organization_drafts",
      draft.id,
    );
    assert.equal(
      after,
      0,
      "all permissions for the deleted draft should be cleaned up",
    );
  });

  test("does not affect permissions of other draft instances", async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: uniqueEmail("destroycleanup2"),
      password: "Passw0rd!",
      fullName: "Destroy Cleanup User 2",
    });
    await user.refresh();
    const token = await makeToken(user);

    const draftToDelete = await createBaseDraft(user.id);
    const draftToKeep = await createBaseDraft(user.id);

    await Acl.model(user).allow("read", draftToDelete);
    await Acl.model(user).allow("destroy", draftToDelete);
    await Acl.model(user).allow("read", draftToKeep);

    // Delete only the first draft
    const res = await client
      .delete(`/api/v1/student_organization_drafts/${draftToDelete.id}`)
      .header("Authorization", `Bearer ${token}`);
    res.assertStatus(200);

    // Permissions for the deleted draft must be gone
    const deletedDraftPerms = await countPermissionsFor(
      "student_organization_drafts",
      draftToDelete.id,
    );
    assert.equal(deletedDraftPerms, 0);

    // Permissions for the surviving draft must remain
    const keptDraftPerms = await countPermissionsFor(
      "student_organization_drafts",
      draftToKeep.id,
    );
    assert.isAbove(
      keptDraftPerms,
      0,
      "permissions for undeleted draft should survive",
    );
  });

  test("destroy of a non-ACL model succeeds without error", async ({
    client,
    assert,
  }) => {
    // Library has no @MorphMap — permission cleanup is a no-op
    const { default: Library } = await import("#models/library");
    const lib = await Library.create({
      title: "CleanupTest Library",
      latitude: 10,
      longitude: 20,
      branch: Branch.Main,
    });

    // Need solvro_admin to delete a Library
    const admin = await User.create({
      email: uniqueEmail("libadmin"),
      password: "Passw0rd!",
      fullName: "Lib Admin",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const res = await client
      .delete(`/api/v1/libraries/${lib.id}`)
      .header("Authorization", `Bearer ${token}`);
    res.assertStatus(200);
    const body = res.body() as { success?: boolean };
    assert.equal(body.success, true);
  });
});
