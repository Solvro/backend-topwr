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

type ResourceName =
  | "student_organization_drafts"
  | "guide_article_drafts"
  | "student_organizations"
  | "guide_articles";

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
    const isAdmin = await (auth.user as any)?.hasRole?.("solvro_admin");
    if (!isAdmin) {
      throw new ForbiddenException();
    }
  }

  async allow({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    const body = request.only(["userId", "action", "resource"]);
    const { userId, action, resource } = body as {
      userId: number;
      action: ActionSlug;
      resource: {
        type: "class" | "model";
        name: ResourceName;
        id?: number;
      };
    };

    if (!userId || !action || !resource?.type || !resource?.name) {
      return { success: false, error: "Invalid request body" };
    }

    const targetUser = await User.find(userId);
    if (!targetUser) throw new NotFoundException("User not found");

    const Model = resourceRegistry[resource.name];
    if (!Model) return { success: false, error: "Unsupported resource" };

    if (resource.type === "class") {
      await Acl.model(targetUser).allow(action, Model);
      return { success: true };
    }

    if (!resource.id) return { success: false, error: "Missing resource.id" };
    const instance = await Model.find(resource.id);
    if (!instance) throw new NotFoundException("Resource not found");
    await Acl.model(targetUser).allow(action, instance);
    return { success: true };
  }

  async revoke({ request, auth }: HttpContext) {
    await this.ensureSolvroAdmin(auth);

    const body = request.only(["userId", "action", "resource"]);
    const { userId, action, resource } = body as {
      userId: number;
      action: ActionSlug;
      resource: {
        type: "class" | "model";
        name: ResourceName;
        id?: number;
      };
    };

    if (!userId || !action || !resource?.type || !resource?.name) {
      return { success: false, error: "Invalid request body" };
    }

    const targetUser = await User.find(userId);
    if (!targetUser) throw new NotFoundException("User not found");

    const Model = resourceRegistry[resource.name];
    if (!Model) return { success: false, error: "Unsupported resource" };

    // Try common revoke method names; if library exposes a different API, TS will guide fixes.
    const manager = Acl.model(targetUser) as any;

    if (resource.type === "class") {
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

    if (!resource.id) return { success: false, error: "Missing resource.id" };
    const instance = await Model.find(resource.id);
    if (!instance) throw new NotFoundException("Resource not found");

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
