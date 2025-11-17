import { Acl } from "@holoyan/adonisjs-permissions";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";

import { ForbiddenException } from "#exceptions/http_exceptions";
import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";
import User from "#models/user";
import {
  allowPermissionValidator,
  revokePermissionValidator,
} from "#validators/permissions";

function isResourceKey(name: unknown): name is keyof typeof resourceRegistry {
  return (
    typeof name === "string" &&
    Object.prototype.hasOwnProperty.call(resourceRegistry, name)
  );
}

const resourceRegistry = {
  student_organization_drafts: StudentOrganizationDraft,
  guide_article_drafts: GuideArticleDraft,
  student_organizations: StudentOrganization,
  guide_articles: GuideArticle,
} as const;

export default class PermissionsController {
  $configureRoutes(controller: LazyImport<Constructor<PermissionsController>>) {
    router.post("/allow", [controller, "allow"]).as("allow");
    router.post("/revoke", [controller, "revoke"]).as("revoke");
    router.get("/list", [controller, "listUserPermissions"]).as("list");
  }

  private async ensureSolvroAdmin(auth: HttpContext["auth"]) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const isAdmin = await (
      auth.user as unknown as { hasRole?: (slug: string) => Promise<boolean> }
    ).hasRole?.("solvro_admin");
    if (isAdmin !== true) {
      throw new ForbiddenException();
    }
  }

  async allow({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    // Use vine validator
    const { userId, action, resource } = await request.validateUsing(
      allowPermissionValidator,
    );

    if (!isResourceKey(resource.name)) {
      return { success: false, error: "Invalid resource.name" };
    }

    // Use findOrFail with error context
    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    const Model = resourceRegistry[resource.name];

    if (resource.type === "class") {
      await Acl.model(targetUser).allow(action, Model);
      return { success: true };
    }

    // resource.type is "model", id is required
    if (resource.id === undefined) {
      return { success: false, error: "Missing resource.id" };
    }

    const instance = await Model.findOrFail(resource.id).addErrorContext(
      () => `${resource.name} with id ${resource.id} not found`,
    );

    await Acl.model(targetUser).allow(action, instance);
    return { success: true };
  }

  async revoke({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    // Use vine validator
    const { userId, action, resource } = await request.validateUsing(
      revokePermissionValidator,
    );

    if (!isResourceKey(resource.name)) {
      return { success: false, error: "Invalid resource.name" };
    }

    // Use findOrFail with error context
    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    const Model = resourceRegistry[resource.name];
    const manager = Acl.model(targetUser);

    if (resource.type === "class") {
      await manager.revoke(action, Model);
      return { success: true };
    }

    // resource.type is "model", id is required
    if (resource.id === undefined) {
      return { success: false, error: "Missing resource.id" };
    }

    const instance = await Model.findOrFail(resource.id).addErrorContext(
      () => `${resource.name} with id ${resource.id} not found`,
    );

    await manager.revoke(action, instance);
    return { success: true };
  }

  /**
   * List all permissions for a specific user
   */
  async listUserPermissions({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    const userIdInput: unknown = request.input("userId");
    const userId =
      typeof userIdInput === "number"
        ? userIdInput
        : typeof userIdInput === "string"
          ? Number(userIdInput)
          : undefined;

    if (userId === undefined || !Number.isFinite(userId)) {
      return { success: false, error: "Valid userId is required" };
    }

    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    // Query roles
    const roles = await db
      .from("model_roles")
      .join("access_roles", "model_roles.role_id", "access_roles.id")
      .where("model_roles.model_type", "users")
      .where("model_roles.model_id", targetUser.id)
      .select("access_roles.slug", "access_roles.title");

    // Query class-level permissions
    const classPermissions = await db
      .from("model_permissions")
      .join(
        "access_permissions",
        "model_permissions.permission_id",
        "access_permissions.id",
      )
      .where("model_permissions.model_type", "users")
      .where("model_permissions.model_id", targetUser.id)
      .whereNull("model_permissions.entity_id")
      .select(
        "access_permissions.slug as action",
        "model_permissions.entity_type as resource",
      );

    // Query model-level permissions
    const modelPermissions = await db
      .from("model_permissions")
      .join(
        "access_permissions",
        "model_permissions.permission_id",
        "access_permissions.id",
      )
      .where("model_permissions.model_type", "users")
      .where("model_permissions.model_id", targetUser.id)
      .whereNotNull("model_permissions.entity_id")
      .select(
        "access_permissions.slug as action",
        "model_permissions.entity_type as resource",
        "model_permissions.entity_id as resourceId",
      );

    return {
      userId: targetUser.id,
      email: targetUser.email,
      roles,
      permissions: {
        class: classPermissions,
        model: modelPermissions,
      },
    };
  }
}
