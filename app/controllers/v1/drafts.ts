import { assertExhaustive } from "@solvro/utils/misc";
import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";

import { ForbiddenException } from "#exceptions/http_exceptions";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganizationDraft from "#models/student_organization_draft";

type ResourceType = "organization_draft" | "article_draft";

const resourceTypeEnum = vine.enum([
  "organization_draft",
  "article_draft",
] as ResourceType[]);

const listDraftsValidator = vine.compile(
  vine.object({
    resourceType: resourceTypeEnum.optional(),
  }),
);

export default class DraftsController {
  $configureRoutes(controller: LazyImport<Constructor<DraftsController>>) {
    router.get("/", [controller, "index"]).as("index");
  }

  private async ensureAuthenticated(auth: HttpContext["auth"]) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
  }

  private async hasReadAccess(
    auth: HttpContext["auth"],
    resourceType: ResourceType | undefined,
  ): Promise<boolean> {
    const user = auth.user as unknown as
      | {
          hasRole?: (slug: string) => Promise<boolean>;
          hasPermission?: (
            action: string,
            target?: unknown,
          ) => Promise<boolean>;
        }
      | undefined;

    // Admin roles bypass
    const hasSolvroAdminRole = (await user?.hasRole?.("solvro_admin")) === true;
    const hasAdminRole = (await user?.hasRole?.("admin")) === true;
    if (hasSolvroAdminRole || hasAdminRole) {
      return true;
    }

    // Check class-level read on either draft type
    const canReadOrgDrafts = await user?.hasPermission?.(
      "read",
      StudentOrganizationDraft,
    );
    const canReadArticleDrafts = await user?.hasPermission?.(
      "read",
      GuideArticleDraft,
    );

    switch (resourceType) {
      case "organization_draft":
        return canReadOrgDrafts === true;
      case "article_draft":
        return canReadArticleDrafts === true;
      case undefined:
        return canReadOrgDrafts === true || canReadArticleDrafts === true;
      default:
        assertExhaustive(resourceType);
    }
  }

  /**
   * List drafts of both types with optional resource_type filter
   * GET /api/v1/drafts?resourceType=organization_draft|article_draft
   */
  async index({ request, auth }: HttpContext) {
    await this.ensureAuthenticated(auth);

    const { resourceType } = await request.validateUsing(listDraftsValidator);

    const hasAccess = await this.hasReadAccess(auth, resourceType);
    if (!hasAccess) {
      throw new ForbiddenException();
    }

    const results: {
      resourceType: ResourceType;
      data: unknown;
    }[] = [];

    const shouldFetchOrg =
      resourceType === undefined || resourceType === "organization_draft";
    const shouldFetchArticle =
      resourceType === undefined || resourceType === "article_draft";

    if (shouldFetchOrg) {
      const orgDrafts = await StudentOrganizationDraft.query()
        .preload("logo")
        .preload("cover")
        .preload("department")
        .preload("original")
        .exec();
      results.push(
        ...orgDrafts.map((draft) => ({
          resourceType: "organization_draft" as const,
          data: draft.toJSON(),
        })),
      );
    }

    if (shouldFetchArticle) {
      const articleDrafts = await GuideArticleDraft.query()
        .preload("image")
        .preload("original")
        .preload("createdBy")
        .exec();
      results.push(
        ...articleDrafts.map((draft) => ({
          resourceType: "article_draft" as const,
          data: draft.toJSON(),
        })),
      );
    }

    return { data: results };
  }
}
