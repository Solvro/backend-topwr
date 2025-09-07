import GuideArticle from "#models/guide_article";
import GuideArticleDraft from "#models/guide_article_draft";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class GuideArticleDraftsController extends BaseController<
  typeof GuideArticleDraft
> {
  protected readonly queryRelations = ["image", "originalArticle"];
  protected readonly crudRelations: string[] = [];
  protected readonly model = GuideArticleDraft;

  protected async authenticate(http: any, action: any): Promise<void> {
    if (!http.auth.isAuthenticated) {
      await http.auth.authenticate();
    }
    if (action === "store") {
      const isAdmin =
        (await http.auth.user?.hasRole?.("solvro_admin")) ||
        (await http.auth.user?.hasRole?.("admin"));
      if (isAdmin) return;
      const allowed = await http.auth.user?.hasPermission("create", this.model);
      if (!allowed) {
        throw new (
          await import("#exceptions/http_exceptions")
        ).ForbiddenException();
      }
    }
  }

  protected requiredPermissionFor(_action: any) {
    return null;
  }

  protected async authorizeById(http: any, action: any, ids: any) {
    const isAdmin =
      (await http.auth.user?.hasRole?.("solvro_admin")) ||
      (await http.auth.user?.hasRole?.("admin"));
    if (isAdmin) return;

    const { id, localId } = ids ?? {};
    const draftId = (id ?? localId) as number | undefined;
    if (draftId === undefined) return;

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

    const allowed = await http.auth.user?.hasPermission(slug, this.model);
    if (!allowed) {
      const instance = await this.model.find(draftId);
      if (!instance) {
        throw new (
          await import("#exceptions/http_exceptions")
        ).ForbiddenException();
      }
      const has = await http.auth.user?.hasPermission(slug, instance);
      if (!has) {
        throw new (
          await import("#exceptions/http_exceptions")
        ).ForbiddenException();
      }
    }
  }

  // When linking to an existing article, require per-model permission on the original article
  protected async storeHook(ctx: any) {
    const { http, request } = ctx;
    const originalId = (request as any).originalArticleId as
      | number
      | null
      | undefined;
    if (!originalId) return;

    const isAdmin =
      (await http.auth.user?.hasRole?.("solvro_admin")) ||
      (await http.auth.user?.hasRole?.("admin"));
    if (isAdmin) return;

    const article = await GuideArticle.find(originalId);
    if (!article) {
      throw new (await import("#exceptions/http_exceptions")).NotFoundException(
        `GuideArticle with id ${originalId} not found`,
      );
    }
    const allowed = await http.auth.user?.hasPermission("update", article);
    if (!allowed) {
      throw new (
        await import("#exceptions/http_exceptions")
      ).ForbiddenException();
    }
  }
}
