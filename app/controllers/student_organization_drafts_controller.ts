import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { LazyImport } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";

import BaseController from "#controllers/base_controller";
import type { PartialModel } from "#controllers/base_controller";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";

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
        const { ForbiddenException } = await import(
          "#exceptions/http_exceptions"
        );
        throw new ForbiddenException();
      }
    }
  }

  protected requiredPermissionFor(_action: Action) {
    return null; // disable global slug checks for this controller
  }

  protected async authorizeById(
    http: HttpContext,
    action: Action,
    ids: { localId?: number | string },
  ) {
    // Admin roles bypass handled via hasRole checks
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
        // let BaseController handle not found later; just deny for now
        const { ForbiddenException } = await import(
          "#exceptions/http_exceptions"
        );
        throw new ForbiddenException();
      }
      const has = await user?.hasPermission?.(slug, instance);
      if (has !== true) {
        const { ForbiddenException } = await import(
          "#exceptions/http_exceptions"
        );
        throw new ForbiddenException();
      }
    }
  }

  // If linking to an existing organization, user must be assigned to that organization (per-model permission)
  protected async storeHook(ctx: {
    http: HttpContext;
    request: PartialModel<typeof StudentOrganizationDraft>;
  }) {
    const { http, request } = ctx;
    const originalId = request.originalOrganizationId;
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

    const org = await StudentOrganization.find(originalId);
    if (org === null) {
      const { NotFoundException } = await import("#exceptions/http_exceptions");
      throw new NotFoundException(
        `StudentOrganization with id ${originalId} not found`,
      );
    }
    const allowed = await user?.hasPermission?.("update", org);
    if (allowed !== true) {
      const { ForbiddenException } = await import(
        "#exceptions/http_exceptions"
      );
      throw new ForbiddenException();
    }
  }

  async index(httpCtx: HttpContext): Promise<unknown> {
    const { request } = httpCtx;
    await this.selfValidate();
    await this.authenticate(httpCtx, "index");

    const { paginationValidator } = await import("#validators/pagination");
    const { page, limit } = await request.validateUsing(paginationValidator);
    const relationsValidated = (await request.validateUsing(
      this.relationValidator,
    )) as unknown;
    const relations: string[] = Array.isArray(relationsValidated)
      ? (relationsValidated as string[])
      : Object.entries(
          relationsValidated as Record<string, boolean | undefined>,
        )
          .filter(([, enabled]) => enabled === true)
          .map(([name]) => name);

    const baseQuery = this.model.query().withScopes((scopes) => {
      try {
        // handleSearchQuery may not exist on related scopes in some models
        (
          scopes as unknown as {
            handleSearchQuery?: (q: Record<string, unknown>) => void;
          }
        ).handleSearchQuery?.(request.qs());
      } catch {}
      try {
        (
          scopes as unknown as { preloadRelations?: (rels: string[]) => void }
        ).preloadRelations?.(relations);
      } catch {}
      try {
        (
          scopes as unknown as { handleSortQuery?: (sort: unknown) => void }
        ).handleSortQuery?.(request.input("sort"));
      } catch {}
    });

    // For non-admins, we cannot filter by pivot (no manual relation). Optional: keep unfiltered index,
    // per-id endpoints are protected by authorizeById. If index must be filtered, add custom scope here
    // using ACL tables. For now, leave index unrestricted after auth.

    if (page === undefined && limit === undefined) {
      return { data: await baseQuery };
    }
    return await baseQuery.paginate(page ?? 1, limit ?? 10);
  }

  $configureRoutes(
    controller: LazyImport<
      Constructor<BaseController<typeof StudentOrganizationDraft>>
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
      const { ForbiddenException } = await import(
        "#exceptions/http_exceptions"
      );
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
      const { NotFoundException } = await import("#exceptions/http_exceptions");
      throw new NotFoundException();
    }
    const draft = await StudentOrganizationDraft.find(draftId);
    if (draft === null) {
      const { NotFoundException } = await import("#exceptions/http_exceptions");
      throw new NotFoundException();
    }

    const draftData: PartialModel<typeof StudentOrganization> = {
      name: draft.name,
      isStrategic: draft.isStrategic,
      branch: draft.branch,
      departmentId: draft.departmentId,
      logoKey: draft.logoKey,
      coverKey: draft.coverKey,
      description: draft.description,
      shortDescription: draft.shortDescription,
      coverPreview: draft.coverPreview,
      source: draft.source,
      organizationType: draft.organizationType,
      organizationStatus: draft.organizationStatus,
    };

    let organization: StudentOrganization;
    if (draft.originalOrganizationId !== null) {
      const existingOrg = await StudentOrganization.find(
        draft.originalOrganizationId,
      );
      if (existingOrg === null) {
        const { NotFoundException } = await import(
          "#exceptions/http_exceptions"
        );
        throw new NotFoundException(
          `Original organization with id ${draft.originalOrganizationId} not found`,
        );
      }
      existingOrg.merge(draftData);
      await existingOrg.save();
      organization = existingOrg;
    } else {
      organization = await StudentOrganization.create(draftData);
    }

    await draft.delete();

    return { data: organization };
  }
}
