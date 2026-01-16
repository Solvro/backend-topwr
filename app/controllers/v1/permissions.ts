import { Acl } from "@holoyan/adonisjs-permissions";
import vine from "@vinejs/vine";

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

const resourceRegistry = {
  student_organization_drafts: StudentOrganizationDraft,
  guide_article_drafts: GuideArticleDraft,
  student_organizations: StudentOrganization,
  guide_articles: GuideArticle,
} as const;

const resourceRegistryKeys = Object.keys(
  resourceRegistry,
) as (keyof typeof resourceRegistry)[];

const actionSchema = vine.enum(["read", "create", "update", "destroy"]);

const permissionChangeValidator = vine.compile(
  vine.object({
    // user for which we're modifying perms
    userId: vine.number(),
    // the action to modify
    action: actionSchema,
    // name of the model to apply the perms to
    modelName: vine.enum(resourceRegistryKeys),
    // the id of the model instance for per-instance/row perms
    // undefined for per-model perms
    instanceId: vine.number().optional(),
  }),
);

const listPermissionsValidator = vine.compile(
  vine.object({
    userId: vine.number(),
  }),
);

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
    const isAdmin = await auth.user?.hasRole("solvro_admin");
    if (isAdmin !== true) {
      throw new ForbiddenException();
    }
  }

  async allow({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    // Use vine validator
    const { userId, action, modelName, instanceId } =
      await request.validateUsing(permissionChangeValidator);

    // Use findOrFail with error context
    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    const Model = resourceRegistry[modelName];

    if (instanceId === undefined) {
      await Acl.model(targetUser)
        .allow(action, Model)
        .addErrorContext("Failed to commit permission changes");
      return { success: true };
    }

    const instance = await Model.findOrFail(instanceId).addErrorContext(
      () => `${modelName} with id ${instanceId} not found`,
    );

    await Acl.model(targetUser)
      .allow(action, instance)
      .addErrorContext("Failed to commit permission changes");
    return { success: true };
  }

  async revoke({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    // Use vine validator
    const { userId, action, modelName, instanceId } =
      await request.validateUsing(permissionChangeValidator);

    // Use findOrFail with error context
    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    const Model = resourceRegistry[modelName];
    const manager = Acl.model(targetUser);

    if (instanceId === undefined) {
      await manager
        .revoke(action, Model)
        .addErrorContext("Failed to commit permission changes");
      return { success: true };
    }

    const instance = await Model.findOrFail(instanceId).addErrorContext(
      () => `${modelName} with id ${instanceId} not found`,
    );

    await manager
      .revoke(action, instance)
      .addErrorContext("Failed to commit permission changes");
    return { success: true };
  }

  /**
   * List all permissions for a specific user
   */
  async listUserPermissions({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    const { userId } = await request.validateUsing(listPermissionsValidator);

    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    // Query roles
    const roles = db
      .from("model_roles")
      .join("access_roles", "model_roles.role_id", "access_roles.id")
      .where("model_roles.model_type", "users")
      .where("model_roles.model_id", targetUser.id)
      .select("access_roles.slug", "access_roles.title")
      .exec()
      .addErrorContext({
        message: "Failed to fetch user roles",
        code: "E_DB_ERROR",
        status: 500,
      });

    // Query permissions
    const permissions = await db
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
        "model_permissions.entity_type as modelName",
        "model_permissions.entity_id as instanceId",
      )
      .exec()
      .addErrorContext({
        message: "Failed to fetch user permissions",
        code: "E_DB_ERROR",
        status: 500,
      });

    return {
      userId: targetUser.id,
      email: targetUser.email,
      roles,
      permissions,
    };
  }
}
