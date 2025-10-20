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
        throw new ForbiddenException();
      }
      const has = await user?.hasPermission?.(slug, instance);
      if (has !== true) {
        throw new ForbiddenException();
      }
    }
  }

  /**
   * If linking to an existing organization, user must be assigned to that organization (per-model permission).
   *
   * Note: Multiple drafts can be created for the same organization. This is intentional to allow:
   * - Different users to propose different changes to the same organization
   * - A user to create multiple draft versions before deciding which to submit
   * - Parallel editing workflows
   *
   * The solvro_admin can approve/reject drafts individually, choosing which changes to apply.
   */
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
      throw new NotFoundException(
        `StudentOrganization with id ${originalId} not found`,
      );
    }
    const allowed = await user?.hasPermission?.("update", org);
    if (allowed !== true) {
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
    const draft = await StudentOrganizationDraft.findOrFail(
      draftId,
    ).addErrorContext(
      () =>
        `StudentOrganizationDraft with id ${draftId} not found or user lacks permission`,
    );

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

    // Use database transaction to ensure atomicity
    const trx = await db.transaction();
    try {
      let organization: StudentOrganization;
      if (draft.originalOrganizationId !== null) {
        // Update existing organization
        const existingOrg = await StudentOrganization.findOrFail(
          draft.originalOrganizationId,
          { client: trx },
        ).addErrorContext(
          () =>
            `Original organization with id ${draft.originalOrganizationId} not found`,
        );
        existingOrg.merge(draftData);
        await existingOrg
          .useTransaction(trx)
          .save()
          .addErrorContext("Failed to update organization");
        organization = existingOrg;
      } else {
        // Create new organization
        organization = await StudentOrganization.create(draftData, {
          client: trx,
        }).addErrorContext("Failed to create organization");
      }

      // Delete draft after successful organization creation/update
      await draft
        .useTransaction(trx)
        .delete()
        .addErrorContext("Failed to delete draft after approval");

      await trx.commit();
      return { data: organization };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}
