import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { LazyImport } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";

import BaseController from "#controllers/base_controller";
import type { PartialModel } from "#controllers/base_controller";
import {
  BadRequestException,
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

  protected async authenticate(
    http: HttpContext,
    action: Action,
  ): Promise<void> {
    if (!http.auth.isAuthenticated) {
      await http.auth.authenticate();
    }
    if (action === "store") {
      const user = http.auth.user as unknown as
        | {
            hasRole?: (slug: string) => Promise<boolean>;
            hasPermission?: (
              action: string,
              target?: unknown,
            ) => Promise<boolean>;
          }
        | undefined;
      const hasSolvroAdminRole =
        (await user?.hasRole?.("solvro_admin")) === true;
      const hasAdminRole = (await user?.hasRole?.("admin")) === true;
      const isAdmin = hasSolvroAdminRole || hasAdminRole;
      if (isAdmin) {
        return;
      }
      const allowed = await user?.hasPermission?.("create", this.model);
      if (allowed !== true) {
        throw new ForbiddenException();
      }
    }
  }

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

  // When linking to an existing article, require per-model permission on the original article
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

  async approve({ params, auth }: HttpContext) {
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

    const rawId: unknown = (params as unknown as { id?: string | number }).id;
    let draftId: number | undefined;
    if (typeof rawId === "string") {
      const numeric = Number(rawId);
      draftId = Number.isNaN(numeric) ? undefined : numeric;
    } else if (typeof rawId === "number") {
      draftId = rawId;
    }
    if (draftId === undefined) {
      throw new NotFoundException();
    }
    const draft = await GuideArticleDraft.find(draftId);
    if (draft === null) {
      throw new NotFoundException();
    }

    const draftData: PartialModel<typeof GuideArticle> = {
      title: draft.title,
      shortDesc: draft.shortDesc,
      description: draft.description,
    };
    if (draft.imageKey !== null) {
      draftData.imageKey = draft.imageKey;
    }

    let article: GuideArticle;
    if (draft.originalArticleId !== null) {
      const existingArticle = await GuideArticle.find(draft.originalArticleId);
      if (existingArticle === null) {
        throw new NotFoundException(
          `Original article with id ${draft.originalArticleId} not found`,
        );
      }
      existingArticle.merge(draftData);
      await existingArticle.save();
      article = existingArticle;
    } else {
      if (draft.imageKey === null) {
        throw new BadRequestException("Cannot create article without image");
      }
      article = await GuideArticle.create(draftData);
    }

    await draft.delete();

    return { data: article };
  }
}
