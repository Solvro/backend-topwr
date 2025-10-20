import { Acl } from "@holoyan/adonisjs-permissions";
import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import { Branch } from "#enums/branch";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";
import User from "#models/user";

function hasRelease(value: unknown): value is { release: () => string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { release?: unknown }).release === "function"
  );
}

async function makeToken(user: User) {
  const token = await User.accessTokens.create(user, [], {
    expiresIn: "1 day",
  });
  if (!hasRelease(token.value)) {
    throw new Error("Token value missing");
  }
  return token.value.release();
}

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@drafts.test`;
}

async function ensureSolvroAdminRoleId(): Promise<number> {
  // Ensure 'solvro_admin' exists in access_roles and return its id
  const roleExists = await db
    .knexQuery()
    .table("access_roles")
    .where({ slug: "solvro_admin" })
    .first()
    .then((row: unknown) => row !== null && row !== undefined);
  if (roleExists) {
    const roleRow: unknown = await db
      .knexQuery()
      .table("access_roles")
      .where({ slug: "solvro_admin" })
      .first();
    // row is present; fetch id using a second query to keep types simple
    if (typeof roleRow === "object" && roleRow !== null && "id" in roleRow) {
      return Number((roleRow as { id: number | string }).id);
    }
    throw new Error("Invalid roleRow payload");
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

test.group("Drafts ACL (per-model and class-level)", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("student org draft: per-model read allows only assigned user", async ({
    client,
  }) => {
    const u1 = await User.create({
      email: uniqueEmail("u1"),
      password: "Passw0rd!",
      fullName: "User 1",
    });
    const u2 = await User.create({
      email: uniqueEmail("u2"),
      password: "Passw0rd!",
      fullName: "User 2",
    });
    const t1 = await makeToken(u1);
    const t2 = await makeToken(u2);

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org A",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    await Acl.model(u1).allow("read", draft);

    const ok = await client
      .get(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`);
    ok.assertStatus(200);

    const bad = await client
      .get(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`);
    bad.assertStatus(403);
  });

  test("student org draft: class-level read allows any draft", async ({
    client,
  }) => {
    const u = await User.create({
      email: uniqueEmail("u3"),
      password: "Passw0rd!",
      fullName: "User 3",
    });
    const token = await makeToken(u);

    const d1 = await StudentOrganizationDraft.create({
      name: "Draft Org B",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });
    const d2 = await StudentOrganizationDraft.create({
      name: "Draft Org C",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    await Acl.model(u).allow("read", StudentOrganizationDraft);

    const res1 = await client
      .get(`/api/v1/student_organization_drafts/${d1.id}`)
      .header("Authorization", `Bearer ${token}`);
    res1.assertStatus(200);

    const res2 = await client
      .get(`/api/v1/student_organization_drafts/${d2.id}`)
      .header("Authorization", `Bearer ${token}`);
    res2.assertStatus(200);
  });

  test("student org draft: per-model update only for assigned user", async ({
    client,
  }) => {
    const u1 = await User.create({
      email: uniqueEmail("u4"),
      password: "Passw0rd!",
      fullName: "User 4",
    });
    const u2 = await User.create({
      email: uniqueEmail("u5"),
      password: "Passw0rd!",
      fullName: "User 5",
    });
    const t1 = await makeToken(u1);
    const t2 = await makeToken(u2);

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org D",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    await Acl.model(u1).allow("update", draft);

    const ok = await client
      .patch(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`)
      .json({ name: "Draft Org D Updated" });
    ok.assertStatus(200);

    const bad = await client
      .patch(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`)
      .json({ name: "Should Fail" });
    bad.assertStatus(403);
  });

  test("guide article draft: per-model read and update", async ({ client }) => {
    const u1 = await User.create({
      email: uniqueEmail("u6"),
      password: "Passw0rd!",
      fullName: "User 6",
    });
    const u2 = await User.create({
      email: uniqueEmail("u7"),
      password: "Passw0rd!",
      fullName: "User 7",
    });
    const t1 = await makeToken(u1);
    const t2 = await makeToken(u2);

    const { default: FileEntry } = await import("#models/file_entry");
    const file = FileEntry.createNew("png");
    await file.save();

    const draft = await GuideArticleDraft.create({
      title: "Guide Draft A",
      shortDesc: "Short",
      description: "Long description",
      imageKey: file.id,
    });

    await Acl.model(u1).allow("read", draft);
    await Acl.model(u1).allow("update", draft);

    const showOk = await client
      .get(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`);
    showOk.assertStatus(200);

    const showBad = await client
      .get(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`);
    showBad.assertStatus(403);

    const updOk = await client
      .patch(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`)
      .json({ title: "Guide Draft A Updated" });
    updOk.assertStatus(200);

    const updBad = await client
      .patch(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`)
      .json({ title: "Should Fail" });
    updBad.assertStatus(403);
  });

  test("student org draft: store requires class-level create or admin", async ({
    client,
  }) => {
    const user = await User.create({
      email: uniqueEmail("u8"),
      password: "Passw0rd!",
      fullName: "User 8",
    });
    const token = await makeToken(user);

    // no permission -> 403
    const noPerm = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        name: "Draft Org New",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Unknown,
        branch: Branch.Main,
      });
    noPerm.assertStatus(403);

    // grant class-level create -> 200
    await Acl.model(user).allow("create", StudentOrganizationDraft);
    const ok = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        name: "Draft Org New 2",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Unknown,
        branch: Branch.Main,
      });
    ok.assertStatus(200);
  });

  test("student org draft: store with originalOrganizationId requires per-model on original", async ({
    client,
  }) => {
    const owner = await User.create({
      email: uniqueEmail("u14"),
      password: "Passw0rd!",
      fullName: "Owner",
    });
    const other = await User.create({
      email: uniqueEmail("u15"),
      password: "Passw0rd!",
      fullName: "Other",
    });
    const tOwner = await makeToken(owner);
    const tOther = await makeToken(other);

    // create a base entity
    const studentOrgModule = await import("#models/student_organization");
    const base = await studentOrgModule.default.create({
      name: "Org Base",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    // grant class-level create on drafts to both
    await Acl.model(owner).allow("create", StudentOrganizationDraft);
    await Acl.model(other).allow("create", StudentOrganizationDraft);

    // but only owner has per-model update on base org
    await Acl.model(owner).allow("update", base);

    // other should be forbidden when referencing originalOrganizationId
    const fail = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${tOther}`)
      .json({
        name: "Draft",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Unknown,
        originalOrganizationId: base.id,
        branch: Branch.Main,
      });
    fail.assertStatus(403);

    const ok = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${tOwner}`)
      .json({
        name: "Draft",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Unknown,
        originalOrganizationId: base.id,
        branch: Branch.Main,
      });
    ok.assertStatus(200);
  });

  test("guide article draft: store with originalArticleId requires per-model on original", async ({
    client,
  }) => {
    const owner = await User.create({
      email: uniqueEmail("u16"),
      password: "Passw0rd!",
      fullName: "Owner 2",
    });
    const other = await User.create({
      email: uniqueEmail("u17"),
      password: "Passw0rd!",
      fullName: "Other 2",
    });
    const tOwner = await makeToken(owner);
    const tOther = await makeToken(other);

    const { default: FileEntry } = await import("#models/file_entry");
    const file = FileEntry.createNew("png");
    await file.save();
    const guideArticleModule = await import("#models/guide_article");
    const article = await guideArticleModule.default.create({
      title: "Base A",
      shortDesc: "S",
      description: "D",
      imageKey: file.id,
    });

    await Acl.model(owner).allow("create", GuideArticleDraft);
    await Acl.model(other).allow("create", GuideArticleDraft);
    await Acl.model(owner).allow("update", article);

    const file2 = FileEntry.createNew("png");
    await file2.save();
    const file3 = FileEntry.createNew("png");
    await file3.save();

    const fail = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${tOther}`)
      .json({
        title: "Ref Draft",
        shortDesc: "S",
        description: "D",
        imageKey: file2.id,
        originalArticleId: article.id,
      });
    fail.assertStatus(403);

    const ok = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${tOwner}`)
      .json({
        title: "Ref Draft",
        imageKey: file3.id,
        shortDesc: "S",
        description: "D",
        originalArticleId: article.id,
      });
    ok.assertStatus(200);
  });

  test("student org draft: destroy requires permission; per-model allowed", async ({
    client,
  }) => {
    const u1 = await User.create({
      email: uniqueEmail("u9"),
      password: "Passw0rd!",
      fullName: "User 9",
    });
    const u2 = await User.create({
      email: uniqueEmail("u10"),
      password: "Passw0rd!",
      fullName: "User 10",
    });
    const t1 = await makeToken(u1);
    const t2 = await makeToken(u2);

    const draft = await StudentOrganizationDraft.create({
      name: "Draft To Delete",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    // grant per-model destroy to u1
    await Acl.model(u1).allow("destroy", draft);

    const bad = await client
      .delete(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`);
    bad.assertStatus(403);

    const ok = await client
      .delete(`/api/v1/student_organization_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`);
    ok.assertStatus(200);
  });

  test("guide article draft: store requires class-level create", async ({
    client,
  }) => {
    const user = await User.create({
      email: uniqueEmail("u11"),
      password: "Passw0rd!",
      fullName: "User 11",
    });
    const token = await makeToken(user);

    const { default: FileEntry } = await import("#models/file_entry");
    const file3 = FileEntry.createNew("png");
    await file3.save();
    const file4 = FileEntry.createNew("png");
    await file4.save();

    const noPerm = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        title: "Guide Draft New",
        shortDesc: "Short",
        description: "Long",
        imageKey: file3.id,
      });
    noPerm.assertStatus(403);

    await Acl.model(user).allow("create", GuideArticleDraft);
    const ok = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        title: "Guide Draft New 2",
        shortDesc: "Short",
        description: "Long",
        imageKey: file4.id,
      });
    ok.assertStatus(200);
  });

  test("guide article draft: destroy requires per-model", async ({
    client,
  }) => {
    const u1 = await User.create({
      email: uniqueEmail("u12"),
      password: "Passw0rd!",
      fullName: "User 12",
    });
    const u2 = await User.create({
      email: uniqueEmail("u13"),
      password: "Passw0rd!",
      fullName: "User 13",
    });
    const t1 = await makeToken(u1);
    const t2 = await makeToken(u2);

    const { default: FileEntry } = await import("#models/file_entry");
    const file2 = FileEntry.createNew("png");
    await file2.save();

    const draft = await GuideArticleDraft.create({
      title: "Guide To Delete",
      shortDesc: "Short",
      description: "Long",
      imageKey: file2.id,
    });

    await Acl.model(u1).allow("destroy", draft);

    const bad = await client
      .delete(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t2}`);
    bad.assertStatus(403);

    const ok = await client
      .delete(`/api/v1/guide_article_drafts/${draft.id}`)
      .header("Authorization", `Bearer ${t1}`);
    ok.assertStatus(200);
  });

  test("student org draft: approve creates new organization and deletes draft", async ({
    client,
    assert,
  }) => {
    const adminUser = await User.create({
      email: uniqueEmail("admin-approve"),
      password: "Passw0rd!",
      fullName: "Approve Admin",
    });
    await assignSolvroAdmin(adminUser);
    const adminToken = await makeToken(adminUser);

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org To Approve",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    const response = await client
      .post(`/api/v1/student_organization_drafts/${draft.id}/approve`)
      .header("Authorization", `Bearer ${adminToken}`);
    response.assertStatus(200);

    // Check that organization was created
    const org = await StudentOrganization.findBy(
      "name",
      "Draft Org To Approve",
    );
    if (org === null) {
      throw new Error("Organization not found after approve");
    }
    assert.equal(org.isStrategic, true);

    // Check that draft was deleted
    const deletedDraft = await StudentOrganizationDraft.find(draft.id);
    assert.isNull(deletedDraft);
  });

  test("student org draft: approve updates existing organization", async ({
    client,
    assert,
  }) => {
    const adminUser = await User.create({
      email: uniqueEmail("admin-approve2"),
      password: "Passw0rd!",
      fullName: "Approve Admin 2",
    });
    await assignSolvroAdmin(adminUser);
    const adminToken = await makeToken(adminUser);

    const existingOrg = await StudentOrganization.create({
      name: "Existing Org",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    const draft = await StudentOrganizationDraft.create({
      name: "Updated Org",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      originalOrganizationId: existingOrg.id,
      branch: Branch.Main,
    });

    const response = await client
      .post(`/api/v1/student_organization_drafts/${draft.id}/approve`)
      .header("Authorization", `Bearer ${adminToken}`);
    response.assertStatus(200);

    // Check that organization was updated
    await existingOrg.refresh();
    assert.equal(existingOrg.name, "Updated Org");
    assert.equal(existingOrg.isStrategic, true);

    // Check that draft was deleted
    const deletedDraft = await StudentOrganizationDraft.find(draft.id);
    assert.isNull(deletedDraft);
  });

  test("student org draft: approve requires solvro_admin", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("regular-approve"),
      password: "Passw0rd!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org No Approve",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Unknown,
      branch: Branch.Main,
    });

    const response = await client
      .post(`/api/v1/student_organization_drafts/${draft.id}/approve`)
      .header("Authorization", `Bearer ${token}`);
    response.assertStatus(403);
  });
});
