import { assertExhaustive } from "@solvro/utils/misc";
import vine from "@vinejs/vine";
import assert from "node:assert";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";
import { LucidModel, ModelAttributes } from "@adonisjs/lucid/types/model";

import {
  ValidatedColumnDef,
  validateColumnDef,
} from "#app/decorators/typed_model";
import { thinModel } from "#app/utils/permissions";
import { ForbiddenException } from "#exceptions/http_exceptions";
import GuideArticleDraft from "#models/guide_article_draft";
import StudentOrganizationDraft from "#models/student_organization_draft";

import BaseController, {
  ControllerAction,
  Scopes,
} from "../base_controller.js";

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

// =========================
// GENERIC DRAFTS CONTROLLER
// =========================

interface BaseDraft {
  createdByUserId: number;
  originalId: number | null;
}
interface BaseApproved {
  id: number;
}

export abstract class GenericDraftController<
  Approved extends LucidModel,
  Draft extends LucidModel & Scopes<LucidModel>,
  ApprovedInstance extends ModelAttributes<InstanceType<Approved>> &
    BaseApproved,
  DraftInstance extends ModelAttributes<InstanceType<Draft>> &
    ApprovedInstance &
    BaseDraft,
> extends BaseController<Draft> {
  // protected readonly queryRelations = ["image", "original", "createdBy"];
  protected readonly crudRelations: string[] = [];
  protected abstract readonly model: Draft;
  protected abstract readonly approvedModel: Approved;
  protected superUserRoles: string[] = ["solvro_admin", "admin"];

  protected requiredPermissionFor(action: ControllerAction): string {
    switch (action) {
      // actions with instance-level checks - require authentication, don't check perms
      case "show":
      case "update":
      case "destroy":
      case "relationIndex":
      case "oneToManyRelationStore":
      case "manyToManyRelationAttach":
      case "manyToManyRelationDetach":
        return "authOnly";
      // other actions
      case "index":
        return "read";
      case "store":
        return "create";
      default:
        assertExhaustive(action);
    }
  }

  private trimDraft(
    draft: DraftInstance,
  ): ModelAttributes<InstanceType<Approved>> {
    const result = {} as ModelAttributes<InstanceType<Approved>>;
    for (const [
      column,
      def,
    ] of this.approvedModel.$columnsDefinitions.entries()) {
      if (!validateColumnDef(def)) {
        continue;
      }
      const validatedDef = def as ValidatedColumnDef;
      if (
        !validatedDef.meta.typing.autoGenerated &&
        // @ts-expect-error -- adonis moment - column in draft doesn't work
        draft[column] !== undefined
      ) {
        // @ts-expect-error -- aaaaaaaa
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result[column] = draft[column];
      }
    }
    return result;
  }

  protected async authorizeById(
    http: HttpContext,
    action: ControllerAction,
    ids: { localId: number },
  ) {
    // BaseController's authenticate() should've ensured the user is logged in
    assert(http.auth.user !== undefined);
    const user = http.auth.user;

    const isAdmin = await user.hasAnyRole(...this.superUserRoles);
    if (isAdmin) {
      return;
    }

    // Map controller action to permission slug
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

    // check resource- and instance-scoped permissions (yes, this checks both, i've checked the source code)
    const allowed = await user.hasPermission(
      slug,
      thinModel(this.model, ids.localId),
    );
    if (!allowed) {
      throw new ForbiddenException();
    }
  }

  /**
   * If linking to an existing article, user must be assigned to that article (per-model permission).
   *
   * typings here are a bit off, but i can't figure out a better way to type this - adonis moment
   */
  protected storeHook = async function (
    this: GenericDraftController<
      Approved,
      Draft,
      ApprovedInstance,
      DraftInstance
    >,
    ctx: {
      http: HttpContext;
      request: Partial<DraftInstance>;
    },
  ) {
    const { http, request } = ctx;

    // authenticate() should've authenticated the user already
    assert(http.auth.user !== undefined);
    const user = http.auth.user;

    const isAdmin = await user.hasAnyRole(...this.superUserRoles);
    if (isAdmin) {
      return;
    }

    request.createdByUserId = http.auth.user
      .id as DraftInstance["createdByUserId"];
    const originalId = request.originalId;

    // For completely new drafts (no original article), require create permission on GuideArticle
    if (originalId === null || originalId === undefined) {
      const allowed = await user.hasPermission("create", this.approvedModel);
      if (!allowed) {
        throw new ForbiddenException(
          `Requires create permission on ${this.approvedModel.name} to propose new articles`,
        );
      }
      return;
    }

    // For drafts editing existing articles, require update permission on the original article
    const allowed = await user.hasPermission(
      "update",
      thinModel(this.approvedModel, originalId),
    );
    if (!allowed) {
      throw new ForbiddenException();
    }
  } as unknown as BaseController<Draft>["storeHook"];

  $configureRoutes(
    controller: LazyImport<
      Constructor<
        GenericDraftController<Approved, Draft, ApprovedInstance, DraftInstance>
      >
    >,
  ) {
    super.$configureRoutes(controller);
    router.post("/:id/approve", [controller, "approve"]).as("approve");
  }

  async approve({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    assert(auth.user !== undefined);
    // Only solvro_admin can approve drafts
    const isSolvroAdmin = await auth.user.hasRole("solvro_admin");
    if (!isSolvroAdmin) {
      throw new ForbiddenException();
    }

    // Use autogenerated validator for ID
    const {
      params: { id: draftId },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: number };
    };

    // Use findOrFail with error context
    const draft = (await this.model
      .findOrFail(draftId)
      .addErrorContext(
        () => `${this.model.name} with id ${draftId} not found`,
      )) as DraftInstance & InstanceType<Draft>;

    return await db.transaction(async (trx) => {
      let approved: ApprovedInstance & InstanceType<Approved>;

      if (draft.originalId !== null) {
        const existingEntry = await this.approvedModel
          .findOrFail(draft.originalId, { client: trx })
          .addErrorContext(
            () =>
              `${this.approvedModel.name} with id ${draft.originalId} not found`,
          );

        // manual merge based on solvronis data
        existingEntry.merge(this.trimDraft(draft));

        await existingEntry
          .useTransaction(trx)
          .save()
          .addErrorContext(
            () => `Failed to save updated ${this.approvedModel.name}`,
          );
        approved = existingEntry as ApprovedInstance & InstanceType<Approved>;
      } else {
        approved = (await this.approvedModel
          .create(this.trimDraft(draft), {
            client: trx,
          })
          .addErrorContext(
            () => `Failed to create new ${this.approvedModel.name}`,
          )) as ApprovedInstance & InstanceType<Approved>;
      }

      await draft
        .useTransaction(trx)
        .delete()
        .addErrorContext("Failed to delete GuideArticleDraft after approval");

      return { success: true, approvedId: approved.id };
    });
  }
}
