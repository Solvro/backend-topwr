import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { LazyImport } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";

import type BaseControllerType from "#controllers/base_controller";
import type {
  ControllerAction,
  PartialModel,
} from "#controllers/base_controller";
import {
  ForbiddenException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";

const { default: BaseController } = (await import(
  "#controllers/base_controller"
)) as { default: typeof BaseControllerType };

export default class GuideArticleDraftsController extends BaseController<
  typeof GuideArticleDraft
> {
  protected readonly queryRelations = ["image", "original", "createdBy"];
  protected readonly crudRelations: string[] = [];
  protected readonly model = GuideArticleDraft;

  /**
   * Override to require authentication for all actions.
   * Admin role OR class-level permission grants access.
   * Instance-level permissions are checked in authorizeById().
   */
  protected async authenticate(
    http: HttpContext,
    action: ControllerAction,
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
    const actionsWithIds: ControllerAction[] = ["show", "update", "destroy"];
    if (actionsWithIds.includes(action)) {
      // Don't enforce permission here, let authorizeById handle it
      return;
    }

    // For actions without IDs (index, store), check class-level permission
    const slugMap: Record<ControllerAction, string> = {
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
  protected requiredPermissionFor(_action: ControllerAction) {
    return null;
  }

  protected async authorizeById(
    http: HttpContext,
    action: ControllerAction,
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

    // Map controller action to permission slug
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

    // Check resource-scoped permission using ACL on the model instance reference
    const allowed = await user?.hasPermission?.(slug, this.model);

    // If class-level permission is not granted, check model-level assignment
    if (allowed !== true) {
      const instance = await this.model.find(draftId);
      if (instance === null) {
        throw new ForbiddenException();
      }
      const has = await user?.hasPermission?.(slug, instance);
      if (has !== true) {
        throw new ForbiddenException();
      }
    }
  }

  /**
   * If linking to an existing article, user must be assigned to that article (per-model permission).
   */
  protected async storeHook(ctx: {
    http: HttpContext;
    request: PartialModel<typeof GuideArticleDraft>;
  }) {
    const { http, request } = ctx;

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

    const creatorId = (http.auth.user as { id?: number | string } | undefined)
      ?.id;
    if (creatorId !== undefined) {
      request.createdByUserId = Number(creatorId);
    }

    const originalId = request.originalId;

    // For completely new drafts (no original article), require create permission on GuideArticle
    if (originalId === null || originalId === undefined) {
      const allowed = await user?.hasPermission?.("create", GuideArticle);
      if (allowed !== true) {
        throw new ForbiddenException(
          "Requires create permission on GuideArticle to propose new articles",
        );
      }
      return;
    }

    // For drafts editing existing articles, require update permission on the original article
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
      Constructor<BaseControllerType<typeof GuideArticleDraft>>
    >,
  ) {
    super.$configureRoutes(controller);
    router
      .post("/:id/approve", async (ctx) => {
        const module = await controller();
        const ControllerClass = module.default;
        const instance = new ControllerClass();
        return (
          instance as unknown as {
            approve: (c: HttpContext) => Promise<unknown>;
          }
        ).approve(ctx as unknown as HttpContext);
      })
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
      () => `GuideArticleDraft with id ${draftId} not found`,
    );

    const draftData: PartialModel<typeof GuideArticle> = {
      title: draft.title,
      shortDesc: draft.shortDesc,
      description: draft.description,
      imageKey: draft.imageKey,
    };

    const trx = await db.transaction();
    try {
      let article: GuideArticle;
      if (draft.originalId !== null) {
        const existingArticle = await GuideArticle.findOrFail(
          draft.originalId,
          { client: trx },
        ).addErrorContext(
          () => `GuideArticle with id ${draft.originalId} not found`,
        );
        existingArticle.merge(draftData);
        await existingArticle
          .useTransaction(trx)
          .save()
          .addErrorContext("Failed to save updated GuideArticle");
        article = existingArticle;
      } else {
        article = await GuideArticle.create(draftData, {
          client: trx,
        }).addErrorContext("Failed to create new GuideArticle");
      }

      await draft
        .useTransaction(trx)
        .delete()
        .addErrorContext("Failed to delete GuideArticleDraft after approval");

      await trx.commit();

      return { success: true, articleId: article.id };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}
