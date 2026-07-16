import { Acl } from "@holoyan/adonisjs-permissions";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";

import { Branch } from "#enums/branch";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";

import {
  createAdminWithToken,
  createUniqueEmail,
  createUserWithToken,
} from "./auth_helpers.js";

const uniqueEmail = createUniqueEmail("drafts.test");

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
    const { user: u1, token: t1 } = await createUserWithToken(
      uniqueEmail,
      "u1",
      "User 1",
    );
    const { user: u2, token: t2 } = await createUserWithToken(
      uniqueEmail,
      "u2",
      "User 2",
    );
    await u1.refresh();
    await u2.refresh();

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org A",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: u1.id,
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
    const { user: user3, token } = await createUserWithToken(
      uniqueEmail,
      "user3",
      "User 3",
    );

    await user3.refresh();

    const d1 = await StudentOrganizationDraft.create({
      name: "Draft Org B",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: user3.id,
    });
    const d2 = await StudentOrganizationDraft.create({
      name: "Draft Org C",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: user3.id,
    });

    await Acl.model(user3).allow("read", StudentOrganizationDraft);

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
    const { user: u1, token: t1 } = await createUserWithToken(
      uniqueEmail,
      "user4",
      "User 4",
    );
    const { user: u2, token: t2 } = await createUserWithToken(
      uniqueEmail,
      "user5",
      "User 5",
    );
    await u1.refresh();
    await u2.refresh();

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org D",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: u1.id,
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
    const { user: u1, token: t1 } = await createUserWithToken(
      uniqueEmail,
      "user6",
      "User 6",
    );
    const { user: u2, token: t2 } = await createUserWithToken(
      uniqueEmail,
      "user7",
      "User 7",
    );
    await u1.refresh();
    await u2.refresh();

    const { default: FileEntry } = await import("#models/file_entry");
    const file = FileEntry.createNew("png");
    await file.save();

    const draft = await GuideArticleDraft.create({
      title: "Guide Draft A",
      shortDesc: "Short",
      description: "Long description",
      imageKey: file.id,
      createdByUserId: u1.id,
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

  test("student org draft: store requires class-level create on StudentOrganizationDraft and suggest_new StudentOrganization", async ({
    client,
  }) => {
    const { user, token } = await createUserWithToken(
      uniqueEmail,
      "user8",
      "User 8",
    );

    await user.refresh();

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
        organizationStatus: OrganizationStatus.Active,
        branch: Branch.Main,
      });
    noPerm.assertStatus(403);

    // Only StudentOrganizationDraft create permission -> still 403 (need StudentOrganization create too)
    await Acl.model(user).allow("create", StudentOrganizationDraft);
    const stillNoPerm = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        name: "Draft Org New 2",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Active,
        branch: Branch.Main,
      });
    stillNoPerm.assertStatus(403);

    // Both StudentOrganizationDraft and StudentOrganization create permissions -> 200
    await Acl.model(user).allow("suggest_new", StudentOrganization);
    const ok = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        name: "Draft Org New 3",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Active,
        branch: Branch.Main,
      });
    ok.assertStatus(200);
  });

  test("student org draft: store with originalId requires per-model suggest_edit on original", async ({
    client,
  }) => {
    const { user: owner, token: tOwner } = await createUserWithToken(
      uniqueEmail,
      "u14",
      "Owner",
    );
    const { user: other, token: tOther } = await createUserWithToken(
      uniqueEmail,
      "u15",
      "Other",
    );

    // create a base entity
    const studentOrgModule = await import("#models/student_organization");
    const base = await studentOrgModule.default.create({
      name: "Org Base",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
    });

    // grant class-level create on drafts to both
    await Acl.model(owner).allow("create", StudentOrganizationDraft);
    await Acl.model(other).allow("create", StudentOrganizationDraft);

    // but only owner has per-model update on base org
    await Acl.model(owner).allow("suggest_edit", base);

    // other should be forbidden when referencing originalId
    const fail = await client
      .post(`/api/v1/student_organization_drafts`)
      .header("Authorization", `Bearer ${tOther}`)
      .json({
        name: "Draft",
        isStrategic: false,
        coverPreview: false,
        source: OrganizationSource.Manual,
        organizationType: OrganizationType.StudentOrganization,
        organizationStatus: OrganizationStatus.Active,
        originalId: base.id,
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
        organizationStatus: OrganizationStatus.Active,
        originalId: base.id,
        branch: Branch.Main,
      });
    ok.assertStatus(200);
  });

  test("guide article draft: store with originalId requires per-model suggest_edit on original", async ({
    client,
  }) => {
    const { user: owner, token: tOwner } = await createUserWithToken(
      uniqueEmail,
      "u16",
      "Owner",
    );
    const { user: other, token: tOther } = await createUserWithToken(
      uniqueEmail,
      "u17",
      "Other",
    );

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
    await Acl.model(owner).allow("suggest_edit", article);

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
        originalId: article.id,
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
        originalId: article.id,
      });
    ok.assertStatus(200);
  });

  test("student org draft: destroy requires permission; per-model allowed", async ({
    client,
  }) => {
    const { user: u1, token: t1 } = await createUserWithToken(
      uniqueEmail,
      "u9",
      "User 9",
    );
    const { user: u2, token: t2 } = await createUserWithToken(
      uniqueEmail,
      "u10",
      "User 10",
    );
    await u1.refresh();
    await u2.refresh();

    const draft = await StudentOrganizationDraft.create({
      name: "Draft To Delete",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: u1.id,
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

  test("guide article draft: store requires class-level create on GuideArticleDraft and suggest_new GuideArticle", async ({
    client,
  }) => {
    const { user, token } = await createUserWithToken(
      uniqueEmail,
      "user11",
      "User",
    );

    const { default: FileEntry } = await import("#models/file_entry");
    const { default: GuideArticle } = await import("#models/guide_article");
    const file3 = FileEntry.createNew("png");
    await file3.save();
    const file4 = FileEntry.createNew("png");
    await file4.save();
    const file5 = FileEntry.createNew("png");
    await file5.save();

    // No permissions -> 403
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

    // Only GuideArticleDraft create permission -> still 403 (need GuideArticle create too)
    await Acl.model(user).allow("create", GuideArticleDraft);
    const stillNoPerm = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        title: "Guide Draft New 2",
        shortDesc: "Short",
        description: "Long",
        imageKey: file4.id,
      });
    stillNoPerm.assertStatus(403);

    // Both GuideArticleDraft and GuideArticle create permissions -> 200
    await Acl.model(user).allow("suggest_new", GuideArticle);
    const ok = await client
      .post(`/api/v1/guide_article_drafts`)
      .header("Authorization", `Bearer ${token}`)
      .json({
        title: "Guide Draft New 3",
        shortDesc: "Short",
        description: "Long",
        imageKey: file5.id,
      });
    ok.assertStatus(200);
  });

  test("guide article draft: destroy requires per-model", async ({
    client,
  }) => {
    const { user: u1, token: t1 } = await createUserWithToken(
      uniqueEmail,
      "u12",
      "User 12",
    );
    const { token: t2 } = await createUserWithToken(
      uniqueEmail,
      "u13",
      "User 13",
    );

    const { default: FileEntry } = await import("#models/file_entry");
    const file2 = FileEntry.createNew("png");
    await file2.save();

    const draft = await GuideArticleDraft.create({
      title: "Guide To Delete",
      shortDesc: "Short",
      description: "Long",
      imageKey: file2.id,
      createdByUserId: u1.id,
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
    const { user: adminUser, token: adminToken } = await createAdminWithToken(
      uniqueEmail,
      "admin1",
      "Admin 1",
    );

    await adminUser.refresh();

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org To Approve",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: adminUser.id,
    });

    const response = await client
      .post(`/api/v1/student_organization_drafts/${draft.id}/approve`)
      .header("Authorization", `Bearer ${adminToken}`);
    response.assertStatus(200);
    const jsonResp = JSON.parse(response.text()) as {
      success: boolean;
      approvedId: number;
    };
    assert.ok(jsonResp.success);

    // Check that organization was created
    const org = await StudentOrganization.findOrFail(jsonResp.approvedId);
    assert.equal(org.name, "Draft Org To Approve");
    assert.equal(org.isStrategic, true);

    // Check that draft was deleted
    const deletedDraft = await StudentOrganizationDraft.find(draft.id);
    assert.isNull(deletedDraft);
  });

  test("student org draft: approve updates existing organization", async ({
    client,
    assert,
  }) => {
    const { user: adminUser, token: adminToken } = await createAdminWithToken(
      uniqueEmail,
      "admin2",
      "Admin 2",
    );

    await adminUser.refresh();

    const existingOrg = await StudentOrganization.create({
      name: "Existing Org",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
    });

    const draft = await StudentOrganizationDraft.create({
      name: "Updated Org",
      isStrategic: true,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      originalId: existingOrg.id,
      branch: Branch.Main,
      createdByUserId: adminUser.id,
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
    const { user: regularUser, token } = await createUserWithToken(
      uniqueEmail,
      "regular-approve",
      "Regular User",
    );

    await regularUser.refresh();

    const draft = await StudentOrganizationDraft.create({
      name: "Draft Org No Approve",
      isStrategic: false,
      coverPreview: false,
      source: OrganizationSource.Manual,
      organizationType: OrganizationType.StudentOrganization,
      organizationStatus: OrganizationStatus.Active,
      branch: Branch.Main,
      createdByUserId: regularUser.id,
    });

    const response = await client
      .post(`/api/v1/student_organization_drafts/${draft.id}/approve`)
      .header("Authorization", `Bearer ${token}`);
    response.assertStatus(403);
  });
});
