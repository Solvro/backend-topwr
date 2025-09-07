import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class StudentOrganizationDraftsController extends BaseController<
  typeof StudentOrganizationDraft
> {
  protected readonly queryRelations = [
    "logo",
    "cover",
    "department",
    "originalOrganization",
  ];
  protected readonly crudRelations: string[] = [];
  protected readonly model = StudentOrganizationDraft;

  // All endpoints require auth; for store we also require 'create' permission on the resource class (admin bypass)
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
    return null; // disable global slug checks for this controller
  }

  protected async authorizeById(http: any, action: any, ids: any) {
    // Admin roles bypass handled via hasRole checks
    const isAdmin =
      (await http.auth.user?.hasRole?.("solvro_admin")) ||
      (await http.auth.user?.hasRole?.("admin"));
    if (isAdmin) return;

    const { id, localId } = ids ?? {};
    const draftId = (id ?? localId) as number | undefined;
    if (draftId === undefined) return;

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
    const allowed = await http.auth.user?.hasPermission(slug, this.model);

    // If class-level permission is not granted, check model-level assignment
    if (!allowed) {
      const instance = await this.model.find(draftId);
      if (!instance) {
        // let BaseController handle not found later; just deny for now
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

  // If linking to an existing organization, user must be assigned to that organization (per-model permission)
  protected async storeHook(ctx: any) {
    const { http, request } = ctx;
    const originalId = (request as any).originalOrganizationId as
      | number
      | null
      | undefined;
    if (!originalId) return;

    const isAdmin =
      (await http.auth.user?.hasRole?.("solvro_admin")) ||
      (await http.auth.user?.hasRole?.("admin"));
    if (isAdmin) return;

    const org = await StudentOrganization.find(originalId);
    if (!org) {
      throw new (await import("#exceptions/http_exceptions")).NotFoundException(
        `StudentOrganization with id ${originalId} not found`,
      );
    }
    const allowed = await http.auth.user?.hasPermission("update", org);
    if (!allowed) {
      throw new (
        await import("#exceptions/http_exceptions")
      ).ForbiddenException();
    }
  }

  async index(httpCtx: any): Promise<unknown> {
    const { request } = httpCtx;
    await this.selfValidate();
    await this.authenticate(httpCtx, "index");

    const { page, limit } = await request.validateUsing(
      (await import("#validators/pagination")).paginationValidator,
    );
    const relations = await request.validateUsing(this.relationValidator);

    const baseQuery = this.model.query().withScopes((scopes: any) => {
      scopes.handleSearchQuery(request.qs());
      scopes.preloadRelations(relations);
      scopes.handleSortQuery(request.input("sort"));
    });

    // For non-admins, we cannot filter by pivot (no manual relation). Optional: keep unfiltered index,
    // per-id endpoints are protected by authorizeById. If index must be filtered, add custom scope here
    // using ACL tables. For now, leave index unrestricted after auth.

    if (page === undefined && limit === undefined) {
      return { data: await baseQuery };
    }
    return await baseQuery.paginate(page ?? 1, limit ?? 10);
  }
}
