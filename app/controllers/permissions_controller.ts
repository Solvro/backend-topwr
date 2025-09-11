import { Acl } from "@holoyan/adonisjs-permissions";

import type { HttpContext } from "@adonisjs/core/http";

import {
  ForbiddenException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";
import User from "#models/user";

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

type ActionSlug = "read" | "create" | "update" | "destroy";

export default class PermissionsController {
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

    const body = request.only(["userId", "action", "resource"]) as Record<
      string,
      unknown
    >;
    const rawUserId = body.userId;
    const parsedUserId =
      typeof rawUserId === "number"
        ? rawUserId
        : typeof rawUserId === "string"
          ? Number(rawUserId)
          : Number.NaN;
    const rawAction = body.action;
    const rawResource = body.resource;

    if (
      !Number.isFinite(parsedUserId) ||
      typeof rawAction !== "string" ||
      typeof rawResource !== "object" ||
      rawResource === null
    ) {
      return { success: false, error: "Invalid request body" };
    }
    if (
      rawAction !== "read" &&
      rawAction !== "create" &&
      rawAction !== "update" &&
      rawAction !== "destroy"
    ) {
      return { success: false, error: "Invalid action" };
    }

    const action = rawAction;
    const resource = rawResource as {
      type?: unknown;
      name?: unknown;
      id?: unknown;
    };
    const resourceType = resource.type;
    const resourceName = resource.name;
    if (resourceType !== "class" && resourceType !== "model") {
      return { success: false, error: "Invalid resource.type" };
    }
    if (!isResourceKey(resourceName)) {
      return { success: false, error: "Invalid resource.name" };
    }
    const userId = parsedUserId;

    const targetUser = await User.find(userId);
    if (targetUser === null) {
      throw new NotFoundException("User not found");
    }

    const Model = resourceRegistry[resourceName];

    if (resourceType === "class") {
      await Acl.model(targetUser).allow(action, Model);
      return { success: true };
    }

    const rawId = resource.id;
    const parsedId =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
          ? Number(rawId)
          : Number.NaN;
    if (!Number.isFinite(parsedId)) {
      return { success: false, error: "Missing resource.id" };
    }
    const instance = await Model.find(parsedId);
    if (instance === null) {
      throw new NotFoundException("Resource not found");
    }
    await Acl.model(targetUser).allow(action, instance);
    return { success: true };
  }

  async revoke({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    const body = request.only(["userId", "action", "resource"]) as Record<
      string,
      unknown
    >;
    const rawUserId = body.userId;
    const parsedUserId =
      typeof rawUserId === "number"
        ? rawUserId
        : typeof rawUserId === "string"
          ? Number(rawUserId)
          : Number.NaN;
    const rawAction = body.action;
    const rawResource = body.resource;

    if (
      !Number.isFinite(parsedUserId) ||
      typeof rawAction !== "string" ||
      typeof rawResource !== "object" ||
      rawResource === null
    ) {
      return { success: false, error: "Invalid request body" };
    }
    if (
      rawAction !== "read" &&
      rawAction !== "create" &&
      rawAction !== "update" &&
      rawAction !== "destroy"
    ) {
      return { success: false, error: "Invalid action" };
    }
    const action = rawAction;
    const resource = rawResource as {
      type?: unknown;
      name?: unknown;
      id?: unknown;
    };
    const resourceType = resource.type;
    const resourceName = resource.name;
    if (resourceType !== "class" && resourceType !== "model") {
      return { success: false, error: "Invalid resource.type" };
    }
    if (!isResourceKey(resourceName)) {
      return { success: false, error: "Invalid resource.name" };
    }
    const userId = parsedUserId;

    const targetUser = await User.find(userId);
    if (targetUser === null) {
      throw new NotFoundException("User not found");
    }

    const Model = resourceRegistry[resourceName];

    // Try common revoke method names; if library exposes a different API, TS will guide fixes.
    const manager = Acl.model(targetUser) as unknown as {
      disallow?: (action: ActionSlug, target: unknown) => Promise<void>;
      revoke?: (action: ActionSlug, target: unknown) => Promise<void>;
      remove?: (action: ActionSlug, target: unknown) => Promise<void>;
    };

    if (resourceType === "class") {
      if (typeof manager.disallow === "function") {
        await manager.disallow(action, Model);
      } else if (typeof manager.revoke === "function") {
        await manager.revoke(action, Model);
      } else if (typeof manager.remove === "function") {
        await manager.remove(action, Model);
      } else {
        return { success: false, error: "Revoke not supported by ACL API" };
      }
      return { success: true };
    }

    const rawId = resource.id;
    const parsedId =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
          ? Number(rawId)
          : Number.NaN;
    if (!Number.isFinite(parsedId)) {
      return { success: false, error: "Missing resource.id" };
    }
    const instance = await Model.find(parsedId);
    if (instance === null) {
      throw new NotFoundException("Resource not found");
    }

    if (typeof manager.disallow === "function") {
      await manager.disallow(action, instance);
    } else if (typeof manager.revoke === "function") {
      await manager.revoke(action, instance);
    } else if (typeof manager.remove === "function") {
      await manager.remove(action, instance);
    } else {
      return { success: false, error: "Revoke not supported by ACL API" };
    }
    return { success: true };
  }
}
