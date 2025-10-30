import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { LazyImport } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";

import BaseController from "#controllers/base_controller";
import type { PartialModel } from "#controllers/base_controller";
import {
  ForbiddenException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";

type Action =
  | "index"
  | "show"
  | "store"
  | "update"
  | "destroy"
  | "relationIndex"
  | "oneToManyRelationStore"
  | "manyToManyRelationAttach"
  | "manyToManyRelationDetach";

export default class GuideArticleDraftsController extends BaseController<
  typeof GuideArticleDraft
> {
  protected readonly queryRelations = ["image", "originalArticle"];
  protected readonly crudRelations: string[] = [];
  protected readonly model = GuideArticleDraft;

  /**
   * Override to require authentication for all actions.
   * Admin role OR class-level permission grants access.
   * Instance-level permissions are checked in authorizeById().
   */
  protected async authenticate(
    http: HttpContext,
    action: Action,
  ): Promise<void> {
    if (!http.auth.isAuthenticated) {
      await http.auth.authenticate();
    }

    // Admin roles (solvro_admin or admin) bypass all permission checks
    const user = http.auth.user as unknown as
      | {
          hasRole?: (slug: string) => Promise<boolean>;
          hasPermission?: (
            action: string,
            target?: unknown,
          ) => Promise<boolean>;
        }
      | undefined;
    const hasSolvroAdminRole = (await user?.hasRole?.("solvro_admin")) === true;
    const hasAdminRole = (await user?.hasRole?.("admin")) === true;
    if (hasSolvroAdminRole || hasAdminRole) {
      return;
    }

    // For actions with IDs (show, update, destroy), allow class-level permission check to pass through
    // and rely on authorizeById for instance-level checks
    const actionsWithIds: Action[] = ["show", "update", "destroy"];
    if (actionsWithIds.includes(action)) {
      // Don't enforce permission here, let authorizeById handle it
      return;
    }

    // For actions without IDs (index, store), check class-level permission
    const slugMap: Record<Action, string> = {
      index: "read",
      show: "read",
      store: "create",
      update: "update",
      destroy: "destroy",
      relationIndex: "read",
      oneToManyRelationStore: "update",
      manyToManyRelationAttach: "update",
      manyToManyRelationDetach: "update",
    };
    const slug = slugMap[action];

    const allowed = await user?.hasPermission?.(slug, this.model);
    if (allowed !== true) {
      throw new ForbiddenException();
    }
  }

  /**
   * Override to disable the base permission check since we handle it in authenticate()
   */
  protected requiredPermissionFor(_action: Action) {
    return null;
  }

  protected async authorizeById(
    http: HttpContext,
    action: Action,
    ids: { localId?: number | string },
  ) {
    const user = http.auth.user as unknown as
      | {
          hasRole?: (slug: string) => Promise<boolean>;
          hasPermission?: (
            action: string,
            target?: unknown,
          ) => Promise<boolean>;
        }
      | undefined;
    const isAdmin =
      (await user?.hasRole?.("solvro_admin")) === true ||
      (await user?.hasRole?.("admin")) === true;
    if (isAdmin) {
      return;
    }

    const { localId } = ids;
    const maybeId = localId;
    const draftId = typeof maybeId === "string" ? Number(maybeId) : maybeId;
    if (draftId === undefined) {
      return;
    }

    const slugMap: Record<string, string> = {
      index: "read",
      show: "read",
      store: "create",
      update: "update",
      destroy: "destroy",
      relationIndex: "read",
      oneToManyRelationStore: "update",
      manyToManyRelationAttach: "update",
      manyToManyRelationDetach: "update",
    };
    const slug = slugMap[action] ?? "read";

    const allowed = await user?.hasPermission?.(slug, this.model);
    if (allowed === true) {
      return;
    }

    const instance = await this.model.find(draftId);
    if (instance === null) {
      throw new ForbiddenException();
    }
    const has = await user?.hasPermission?.(slug, instance);
    if (has !== true) {
      throw new ForbiddenException();
    }
  }

  /**
   * When linking to an existing article, require per-model permission on the original article.
   *
   * Note: Multiple drafts can be created for the same article. This is intentional to allow:
   * - Different users to propose different changes to the same article
   * - A user to create multiple draft versions before deciding which to submit
   * - Parallel editing workflows
   *
   * The solvro_admin can approve/reject drafts individually, choosing which changes to apply.
   */
  protected async storeHook(ctx: {
    http: HttpContext;
    request: PartialModel<typeof GuideArticleDraft>;
  }) {
    const { http, request } = ctx;
    const originalId = request.originalArticleId;
    if (originalId === null || originalId === undefined) {
      return;
    }

    const user = http.auth.user as unknown as
      | {
          hasRole?: (slug: string) => Promise<boolean>;
          hasPermission?: (
            action: string,
            target?: unknown,
          ) => Promise<boolean>;
        }
      | undefined;
    const isAdmin =
      (await user?.hasRole?.("solvro_admin")) === true ||
      (await user?.hasRole?.("admin")) === true;
    if (isAdmin) {
      return;
    }

    const article = await GuideArticle.find(originalId);
    if (article === null) {
      throw new NotFoundException(
        `GuideArticle with id ${originalId} not found`,
      );
    }
    const allowed = await user?.hasPermission?.("update", article);
    if (allowed !== true) {
      throw new ForbiddenException();
    }
  }

  $configureRoutes(
    controller: LazyImport<
      Constructor<BaseController<typeof GuideArticleDraft>>
    >,
  ) {
    super.$configureRoutes(controller);
    router
      .post("/:id/approve", [
        controller as LazyImport<Constructor<GuideArticleDraftsController>>,
        "approve",
      ])
      .as("approve");
  }

  async approve({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    // Only solvro_admin can approve drafts
    const isSolvroAdmin = await (
      auth.user as unknown as { hasRole?: (slug: string) => Promise<boolean> }
    ).hasRole?.("solvro_admin");
    if (isSolvroAdmin !== true) {
      throw new ForbiddenException();
    }

    // Use autogenerated validator for ID
    const {
      params: { id: draftId },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };

    // Use findOrFail with error context
    const draft = await GuideArticleDraft.findOrFail(draftId).addErrorContext(
      () =>
        `GuideArticleDraft with id ${draftId} not found or user lacks permission`,
    );

    const draftData: PartialModel<typeof GuideArticle> = {
      title: draft.title,
      shortDesc: draft.shortDesc,
      description: draft.description,
      imageKey: draft.imageKey,
    };

    // Use database transaction to ensure atomicity
    const trx = await db.transaction();
    try {
      let article: GuideArticle;
      if (draft.originalArticleId !== null) {
        // Update existing article
        const existingArticle = await GuideArticle.findOrFail(
          draft.originalArticleId,
          { client: trx },
        ).addErrorContext(
          () => `Original article with id ${draft.originalArticleId} not found`,
        );
        existingArticle.merge(draftData);
        await existingArticle
          .useTransaction(trx)
          .save()
          .addErrorContext("Failed to update article");
        article = existingArticle;
      } else {
        // Create new article
        article = await GuideArticle.create(draftData, {
          client: trx,
        }).addErrorContext("Failed to create article");
      }

      // Delete draft after successful article creation/update
      await draft
        .useTransaction(trx)
        .delete()
        .addErrorContext("Failed to delete draft after approval");

      await trx.commit();
      return { data: article };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}
