import adonisString from "@poppinss/utils/string";
import { BaseError } from "@solvro/error-handling/base";
import assert from "node:assert";
import { Dirent } from "node:fs";
import fs from "node:fs/promises";

import { HttpContext } from "@adonisjs/core/http";
import logger from "@adonisjs/core/services/logger";
import router from "@adonisjs/core/services/router";
import { LazyImport, StoreRouteNode } from "@adonisjs/core/types/http";
import type { Constructor } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";
import {
  ExtractScopes,
  LucidModel,
  LucidRow,
  ModelAttributes,
  ModelQueryBuilderContract,
} from "@adonisjs/lucid/types/model";
import {
  ExtractModelRelations,
  HasManyClientContract,
  HasManyRelationContract,
  ManyToManyClientContract,
  ManyToManyRelationContract,
} from "@adonisjs/lucid/types/relations";

import {
  validateColumnDef,
  validateTypedManyToManyRelation,
} from "#decorators/typed_model";
import {
  InternalControllerError,
  InternalControllerValidationError,
} from "#exceptions/base_controller_errors";
import {
  ForbiddenException,
  NotFoundException,
} from "#exceptions/http_exceptions";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";
import "#utils/maps";
import {
  AnyValidator,
  AutogenCacheEntry,
  PrimaryKeyFieldDescriptor,
  RelationValidator,
  relationValidator,
} from "#utils/model_autogen";
import { paginationValidator } from "#validators/pagination";

export interface Scopes<T extends LucidModel> {
  preloadRelations: ReturnType<typeof preloadRelations<T>>;
  handleSearchQuery: ReturnType<typeof handleSearchQuery<T>>;
  handleSortQuery: ReturnType<typeof handleSortQuery<T>>;
}

// Utility type that removes the first parameter from a function type
// (skips the query parameter in scopes, replicating adonis magic)
type ScopeMethod<F, M extends LucidModel> = F extends (
  query: ModelQueryBuilderContract<M>,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never;

type ScopesWithoutFirstArg<T extends LucidModel> = {
  [K in keyof Scopes<T>]: ScopeMethod<Scopes<T>[K], T>;
};

const selfValidationCache = new Map<
  LucidModel,
  Map<string, InternalControllerValidationError | null>
>();

interface SmuggledScopes {
  smuggledScopes: Record<string, undefined>;
}

// minor amount of trolling for the adonis ORM
// implementation note: you cannot pass the scopes object directly to the resolve func
//   because the resolve func attempts to await the passed params by attempting to call .then(),
//   which adonis does not like
function smuggleScopes(model: LucidModel): Promise<SmuggledScopes> {
  return new Promise((res) =>
    model.query().withScopes((scopes) => res({ smuggledScopes: scopes })),
  );
}

export type PartialModel<T extends LucidModel> = Partial<
  ModelAttributes<InstanceType<T>>
>;

export interface HookContext<T extends LucidModel> {
  http: HttpContext;
  model: T;
  record: InstanceType<T>;
  request: PartialModel<T>;
}

export type CreateHookContext<T extends LucidModel> = Omit<
  HookContext<T>,
  "record"
>;
export type DeleteHookContext<T extends LucidModel> = Omit<
  HookContext<T>,
  "request"
>;

const LOADABLE_EXTENSIONS = [".js", ".ts"];

/**
 * Additional configuration options for the BaseController.$configureRoutes.
 * `skipRoutes` property: if a route should be skipped, set it to true. Defaults to false
 */
export interface RouteConfigurationOptions {
  skipRoutes: {
    index?: boolean;
    store?: boolean;
    show?: boolean;
    destroy?: boolean;
    update?: boolean;
  };
}

// Action names supported by BaseController handlers
export type ControllerAction =
  | "index"
  | "show"
  | "store"
  | "update"
  | "destroy"
  | "relationIndex"
  | "oneToManyRelationStore"
  | "manyToManyRelationAttach"
  | "manyToManyRelationDetach";

// Use the same Constructor type as other controllers (e.g., mobile_config_controller)

export default abstract class BaseController<
  T extends LucidModel & Scopes<LucidModel>,
> {
  /**
   * Relations which should be supported in queries
   * Supports nested relations
   */
  protected abstract readonly queryRelations: string[];
  /**
   * Relations for which CRUD endpoints should be generated
   * Nested relations are NOT supported
   *
   * For 1:n relations only `index` and `store` endpoints are generated
   * For n:m relations `index`, `store`, `link` and `unlink` endpoints are generated
   * `belongsTo` relations (reverse 1:n) are not supported (use queries instead)
   */
  protected abstract readonly crudRelations: string[];
  protected abstract readonly model: T;
  /**
   * If the model is intended to be a singleton, set this field to the instance's database ID.
   * This will cause the index, store and destroy routes to be removed, while show and update will no longer take
   * the id as an url parameter, using this value to look up the instance instead.
   */
  protected readonly singletonId?: number | string;
  /**
   * With the default implementation of `authenticate()`, if the user has any of the following roles, the permission checks are skipped.
   */
  protected superUserRoles: string[] = ["solvro_admin"];

  /**
   * Return the permission slug(s) required for the given action, or null/undefined if none is required.
   * Override this in derived controllers to impose custom requirements per action.
   *
   * Can return:
   *  - string: A single required permission
   *  - string[]: Multiple alternative permissions (user needs ANY of them)
   *  - null/undefined: Public endpoint
   *  - "authOnly": special permission slug - the user will be authenticated, but no permissions will be checked
   *
   * Defaults:
   *  - store -> "create"
   *  - update -> "update"
   *  - destroy -> "destroy"
   *  - relationIndex -> none (public by default)
   *  - oneToManyRelationStore -> "create"
   *  - manyToManyRelationAttach -> "update"
   *  - manyToManyRelationDetach -> "update"
   *  - index/show -> none (public by default)
   *
   * @param action The controller action being performed
   * @param relationName Optional relation name for relation-specific permissions
   */
  protected requiredPermissionFor(
    action: ControllerAction,
    relationName?: string,
  ): string | string[] | null | undefined {
    void relationName; // Available for derived controllers to use
    switch (action) {
      case "store":
        return "create";
      case "update":
        return "update";
      case "destroy":
        return "destroy";
      case "oneToManyRelationStore":
        return "create";
      case "manyToManyRelationAttach":
      case "manyToManyRelationDetach":
        return "update";
      case "index":
      case "show":
      case "relationIndex":
      default:
        return null;
    }
  }

  /**
   * Authenticate and check permission for the given action.
   * If no permission is required, this is a no-op and does not force authentication.
   * Supports both single permissions and alternative permissions (array).
   * Throws ForbiddenException on failure with minimal info.
   *
   * @param http The HTTP context
   * @param action The controller action being performed
   * @param relationName Optional relation name for relation-specific permissions
   */
  protected async authenticate(
    http: HttpContext,
    action: ControllerAction,
    relationName?: string,
  ): Promise<void> {
    const slugs = this.requiredPermissionFor(action, relationName);
    if (slugs === null || slugs === undefined) {
      return; // public endpoint by default
    }

    if (!http.auth.isAuthenticated) {
      await http.auth.authenticate();
    }
    assert(http.auth.user !== undefined);

    // special permission slug - authenticated users only, no permissions required
    if (slugs === "authOnly") {
      return;
    }

    // Superuser bypass
    if (this.superUserRoles.length > 0) {
      const isSuperUser = await http.auth.user.hasAnyRole(
        ...this.superUserRoles,
      );
      if (isSuperUser) {
        return;
      }
    }

    // check if model supports permissions
    if (
      !(
        "getModelId" in this.model.prototype &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- bro i checked it
        typeof this.model.prototype.getModelId === "function"
      )
    ) {
      // looks like we don't support perms, deny
      throw new ForbiddenException();
    }

    // Handle array of alternative permissions (user needs ANY of them)
    const slugArray = Array.isArray(slugs) ? slugs : [slugs];
    const hasPermission = await http.auth.user.hasAnyPermission(
      slugArray,
      this.model,
    );

    if (!hasPermission) {
      throw new ForbiddenException();
    }
  }

  /**
   * Optional id-based authorization hook. Override to enforce row-level checks
   * before interacting with the database to avoid leaking resource existence.
   *
   * @param http - The HTTP context
   * @param action - The controller action being performed
   * @param ids - Object containing optional localId, relatedId, and relationName for row-level authorization
   * @param ids.localId - The local resource ID (optional)
   * @param ids.relatedId - The related resource ID for many-to-many relations (optional)
   * @param ids.relationName - The relation name being accessed (optional)
   */
  protected async authorizeById(
    http: HttpContext,
    action: ControllerAction,
    ids: {
      localId: string | number;
      relatedId?: string | number;
      relationName?: string;
    },
  ): Promise<void> {
    void http;
    void action;
    void ids;
  }

  /**
   * Optional per-record authorization hook. Override to enforce row-level checks
   * after the record is fetched and before any data is returned or mutated.
   *
   * @param http - The HTTP context
   * @param action - The controller action being performed
   * @param record - The record being accessed or mutated
   */
  protected async authorizeRecord(
    http: HttpContext,
    action: ControllerAction,
    record: InstanceType<T>,
  ): Promise<void> {
    void http;
    void action;
    void record;
  }

  /**
   * Apply extra checks to create requests
   *
   * This function will be called just before inserting data into the database.
   * This is the place to ensure this object is actually mutable, or apply any last-minute modifications to the request.
   * You may throw an error here to abort a request, modify & return a request to change it before committing, or return undefined to do nothing.
   * @param ctx the hook context - contains the request.
   * @returns a modified request or undefined
   */
  protected async storeHook(
    ctx: CreateHookContext<T>,
  ): Promise<PartialModel<T> | undefined | void> {
    void ctx;
    return undefined;
  }

  /**
   * Apply extra checks to edit requests
   *
   * This function will be called just before applying any edits.
   * This is the place to ensure this object is actually mutable, or apply any last-minute modifications to the request.
   * You may throw an error here to abort a request, modify & return a request to change it before committing, or return undefined to do nothing.
   * @param ctx the hook context - contains the request and the existing model instance
   * @returns a modified request or undefined
   */
  protected async updateHook(
    ctx: HookContext<T>,
  ): Promise<PartialModel<T> | undefined | void> {
    void ctx;
    return undefined;
  }

  /**
   * Apply extra checks to delete requests
   *
   * This function will be called just before applying any edits.
   * This is the place to ensure this object is actually mutable, or apply any last-minute modifications to the request.
   * You may throw an error here to abort a request, or return undefined to do nothing.
   * @param ctx the hook context - contains the existing model instance
   */
  protected async destroyHook(ctx: DeleteHookContext<T>): Promise<void> {
    void ctx;
  }

  /**
   * Modify records after creation
   *
   * This function will be called after the new record is created.
   * You may apply any extra modifications on the record here. (such as granting initial permissions)
   * Throwing errors here is not advised.
   * @param ctx the hook context - contains the request and the new model instance
   */
  protected async postStoreHook(ctx: HookContext<T>): Promise<void> {
    void ctx;
  }

  #modelCacheEntry?: AutogenCacheEntry;

  private get modelCacheEntry(): AutogenCacheEntry {
    this.#modelCacheEntry ??= AutogenCacheEntry.for(this.model);
    return this.#modelCacheEntry;
  }

  protected get relationValidator(): RelationValidator {
    return relationValidator(this.queryRelations);
  }

  protected subrelationValidator(relation: string): RelationValidator {
    // construct list of applicable subrelations
    const subrelations = this.queryRelations.flatMap((rel) => {
      const relationParts = rel.split(".");
      const firstPart = relationParts.shift();
      if (firstPart !== relation) {
        return [];
      }
      return relationParts.join(".");
    });

    return relationValidator(subrelations);
  }

  protected get primaryKeyField(): PrimaryKeyFieldDescriptor {
    return this.modelCacheEntry.primaryKeyField;
  }

  protected get pathIdValidator(): AnyValidator {
    return this.modelCacheEntry.pathIdValidator;
  }

  protected get storeValidator(): AnyValidator {
    return this.modelCacheEntry.storeValidator;
  }

  protected get updateValidator(): AnyValidator {
    return this.modelCacheEntry.updateValidator;
  }

  protected relatedStoreValidator(relationName: string): AnyValidator {
    return this.modelCacheEntry.relatedStoreValidator(relationName);
  }

  protected attachValidator(relationName: string): AnyValidator {
    return this.modelCacheEntry.attachValidator(relationName);
  }

  protected detachValidator(relationName: string): AnyValidator {
    return this.modelCacheEntry.detachValidator(relationName);
  }

  protected manyToManyIdsValidator(relationName: string): AnyValidator {
    return this.modelCacheEntry.manyToManyIdsValidator(relationName);
  }

  /**
   * The actual self-validation function, does not cache!
   */
  protected async doSelfValidate(): Promise<InternalControllerValidationError | null> {
    const issues = [];

    // Verify scopes
    const requiredScopes = [
      "preloadRelations",
      "handleSearchQuery",
      "handleSortQuery",
    ];
    const { smuggledScopes: smuggledMainScopes } = await smuggleScopes(
      this.model,
    );
    for (const scope of requiredScopes) {
      if (!(scope in this.model)) {
        issues.push(`'${scope}' scope does not exist on the model`);
        continue;
      }
      try {
        // adonis will throw an error here if it's not a valid scope
        void smuggledMainScopes[scope];
      } catch {
        issues.push(
          `'${scope}' scope does not exist on the object passed to the this.model.query().withScopes() callback`,
        );
      }
    }

    // Verify relations
    for (const relationDef of this.queryRelations) {
      const relationChain = relationDef.split(".");
      let currentModel: LucidModel = this.model;
      for (const nextRelation of relationChain) {
        const relation = currentModel.$relationsDefinitions.get(nextRelation);
        if (relation === undefined) {
          issues.push(
            `Relation '${relationDef}' is not a valid relation: subrelation '${nextRelation}' does not exist on model '${currentModel.name}'`,
          );
          break;
        }
        currentModel = relation.relatedModel();
      }
    }

    // Verify CRUD relations
    for (const relationDef of this.crudRelations) {
      const relation = this.model.$relationsDefinitions.get(relationDef);
      if (relation === undefined) {
        issues.push(`Relation '${relationDef}' is not a valid relation`);
        continue;
      }
      if (relation.type !== "hasMany" && relation.type !== "manyToMany") {
        issues.push(
          `Unsupported '${relationDef}' CRUD relation: '${relation.type}' not supported`,
        );
        continue;
      }
      if (
        relation.type === "manyToMany" &&
        !validateTypedManyToManyRelation(relation)
      ) {
        issues.push(
          `ManyToMany relation '${relationDef}' isn't properly typed`,
        );
      }
      const relatedModel = relation.relatedModel();
      for (const [name, column] of relatedModel.$columnsDefinitions.entries()) {
        if (!validateColumnDef(column)) {
          issues.push(
            `Column '${name}' in related model of CRUD relation '${relationDef}' isn't properly typed`,
          );
        }
      }
      const { smuggledScopes: smuggledRelatedScopes } =
        await smuggleScopes(relatedModel);
      for (const scope of requiredScopes) {
        if (!(scope in relatedModel)) {
          issues.push(
            `'${scope}' scope does not exist on the related model of CRUD relation '${relationDef}'`,
          );
          continue;
        }
        try {
          // adonis will throw an error here if it's not a valid scope
          void smuggledRelatedScopes[scope];
        } catch {
          issues.push(
            `'${scope}' scope does not exist on the object passed to the .query().withScopes() callback for related model of CRUD relation '${relationDef}'`,
          );
        }
      }
    }

    // Verify all columns are typed
    for (const [name, columnn] of this.model.$columnsDefinitions.entries()) {
      if (!validateColumnDef(columnn)) {
        issues.push(`Column '${name}' isn't properly typed`);
      }
    }

    // Try to find the primary key field
    try {
      void this.primaryKeyField;
    } catch (error) {
      if (!(error instanceof BaseError)) {
        throw error;
      }
      issues.push(error.message);
    }

    return issues.length === 0
      ? null
      : new InternalControllerValidationError(issues);
  }

  /**
   * Verify that this controller was implemented correctly
   *
   * @throws when this controller was implemented incorrectly
   */
  protected async selfValidate() {
    // cache
    const modelValidationCache = selfValidationCache.getOrInsertWith(
      this.model,
      () => new Map(),
    );

    const relationCacheKey = JSON.stringify([
      this.queryRelations,
      this.crudRelations,
    ]);
    const selfValidationResult =
      await modelValidationCache.getOrInsertWithAsync(
        relationCacheKey,
        this.doSelfValidate.bind(this),
      );
    if (selfValidationResult === null) {
      return;
    }
    throw selfValidationResult;
  }

  /**
   * Generates a configuration callback for a controller using its lazy import
   */
  static async configureRoutes(
    controller: LazyImport<Constructor<unknown>>,
    debugName: string,
  ): Promise<() => void> {
    const imported = await controller();
    const ControllerCtor = imported.default as new (
      ...args: unknown[]
    ) => unknown;
    const instance: unknown = new ControllerCtor();
    if (!(instance instanceof BaseController)) {
      const maybeRoutes = instance as {
        $configureRoutes?: (
          controller: LazyImport<Constructor<unknown>>,
        ) => () => void;
      };
      if (
        !(
          typeof maybeRoutes.$configureRoutes === "function" &&
          maybeRoutes.$configureRoutes.length === 1
        )
      ) {
        throw new Error(
          `Attempted to configure routes for a non-BaseController-based controller which does not implement $configureRoutes: ${debugName}`,
        );
      }
      logger.warn(
        `Configuring routes for a non-BaseController-based controller: ${debugName}`,
      );
      return maybeRoutes.$configureRoutes.bind(
        maybeRoutes,
        controller as LazyImport<Constructor<object>>,
      );
    }
    const baseInstance = instance as BaseController<
      LucidModel & Scopes<LucidModel>
    >;
    return baseInstance.$configureRoutes.bind(
      baseInstance,
      controller as LazyImport<
        Constructor<BaseController<LucidModel & Scopes<LucidModel>>>
      >,
    );
  }

  /**
   * Generates a configuration callback that configures each of the named controllers
   */
  static async configureByNames(paths: string[]): Promise<() => void> {
    const toConfigure: [string, () => void][] = await Promise.all(
      paths.map(async (path) => {
        const controller = (async () =>
          await import(`#controllers/${path}`)) as LazyImport<
          Constructor<unknown>
        >;
        return [path, await BaseController.configureRoutes(controller, path)];
      }),
    );
    return () => {
      for (const [path, config] of toConfigure) {
        const name = path.split("/").at(-1) ?? path;
        router.group(config).prefix(`/${name}`).as(name);
      }
    };
  }

  /**
   * Configures all controller routes automatically
   */
  static async configureAll(): Promise<void> {
    // find all version directories
    let version = 0;
    // map endpoint names to version directories
    // allows new API versions to inherit from earlier ones without symlinks or code duplication
    const currentEndpoints = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      // iterate while directories for each version exist
      const dir = `./app/controllers/v${++version}`;
      try {
        const statResult = await fs.stat(dir);
        if (!statResult.isDirectory()) {
          break;
        }
      } catch {
        break;
      }

      // list directory files for the version
      const verDirReader = await fs.opendir(dir);
      let controllerFile: Dirent | null = null;
      while ((controllerFile = await verDirReader.read()) !== null) {
        // skip non-files
        if (!controllerFile.isFile()) {
          continue;
        }
        for (const ext of LOADABLE_EXTENSIONS) {
          // find the correct extension for the file
          if (!controllerFile.name.endsWith(ext)) {
            continue;
          }
          // add to list
          currentEndpoints.set(
            controllerFile.name.substring(
              0,
              controllerFile.name.length - ext.length,
            ),
            version,
          );
          break;
        }
      }
      await verDirReader.close();

      // configure
      const configureVersion = await BaseController.configureByNames(
        currentEndpoints
          .entries()
          .map(([name, ver]) => `v${ver}/${name}`)
          .toArray(),
      );
      router
        .group(configureVersion)
        .prefix(`/api/v${version}`)
        .as(`v${version}`);
    }
  }

  /**
   * Configures routes for this controller when passed as the group callback
   */
  $configureRoutes(
    controller: LazyImport<Constructor<BaseController<T>>>,
    configurationOptions?: RouteConfigurationOptions,
  ) {
    if (this.singletonId === undefined) {
      // basic routes
      if (!(configurationOptions?.skipRoutes.index === true)) {
        router.get("/", [controller, "index"]).as("index");
      }
      if (!(configurationOptions?.skipRoutes.store === true)) {
        router.post("/", [controller, "store"]).as("store");
      }
      if (!(configurationOptions?.skipRoutes.show === true)) {
        router.get("/:id", [controller, "show"]).as("show");
      }
      if (!(configurationOptions?.skipRoutes.destroy === true)) {
        router.delete("/:id", [controller, "destroy"]).as("destroy");
      }
      if (!(configurationOptions?.skipRoutes.update === true)) {
        router.patch("/:id", [controller, "update"]).as("update");
      }
      // relation routes
      for (const relationName of this.crudRelations) {
        const snakeCaseName = adonisString.snakeCase(relationName);
        router
          .get(`/:id/${snakeCaseName}`, [controller, "relationIndex"])
          .as(`relation.${relationName}.index`);
        const relation = this.model.$relationsDefinitions.get(relationName);
        assert(relation !== undefined);
        if (relation.type === "hasMany") {
          router
            .post(`/:id/${snakeCaseName}`, [
              controller,
              "oneToManyRelationStore",
            ])
            .as(`relation.${relationName}.store`);
        } else if (relation.type === "manyToMany") {
          router
            .post(`/:localId/${snakeCaseName}/:relatedId`, [
              controller,
              "manyToManyRelationAttach",
            ])
            .as(`relation.${relationName}.attach`);
          router
            .delete(`/:localId/${snakeCaseName}/:relatedId`, [
              controller,
              "manyToManyRelationDetach",
            ])
            .as(`relation.${relationName}.detach`);
        }
      }
    } else {
      // singleton special routes
      if (!(configurationOptions?.skipRoutes.show === true)) {
        router.get("/", [controller, "show"]).as("show");
      }
      if (!(configurationOptions?.skipRoutes.update === true)) {
        router.patch("/", [controller, "update"]).as("update");
      }
    }
  }

  /**
   * Determines which relation was requested by the route name
   *
   * @throws {InternalControllerError} if it cannot be determined which relation was requested
   */
  protected relationNameFromRoute(route: StoreRouteNode | undefined): string {
    const routeParts = route?.name?.split(".");
    if (routeParts === undefined) {
      throw new InternalControllerError(
        "No route information available, cannot determine which relation to fetch",
      );
    }
    if (routeParts.at(-3) !== "relation") {
      throw new InternalControllerError(
        `Invalid route name ${route?.name}, expected "relation" to be the 3rd last segment, but found "${routeParts.at(-3)}"`,
      );
    }
    const relationName = routeParts.at(-2);
    assert(relationName !== undefined);
    return relationName;
  }

  /**
   * Display a list of resource
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async index(httpCtx: HttpContext): Promise<unknown> {
    const { request } = httpCtx;
    await this.selfValidate();
    // Public by default; override requiredPermissionFor to restrict
    await this.authenticate(httpCtx, "index");
    const { page, limit } = await request.validateUsing(paginationValidator);
    const relations = await request.validateUsing(this.relationValidator);
    const baseQuery = this.model
      .query()
      .withScopes((scopes: ExtractScopes<T> & ScopesWithoutFirstArg<T>) => {
        scopes.handleSearchQuery(request.qs());
        scopes.preloadRelations(relations);
        scopes.handleSortQuery(request.input("sort"));
      });
    if (page === undefined && limit === undefined) {
      return { data: await baseQuery };
    }
    return await baseQuery.paginate(page ?? 1, limit ?? 10);
  }

  /**
   * Show individual record
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async show(httpCtx: HttpContext): Promise<unknown> {
    const { request } = httpCtx;
    await this.selfValidate();
    await this.authenticate(httpCtx, "show");

    let id: string | number;
    if (this.singletonId !== undefined) {
      id = this.singletonId;
    } else {
      const { params } = (await request.validateUsing(
        this.pathIdValidator,
      )) as {
        params: { id: string | number };
      };
      id = params.id;
    }

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    await this.authorizeById(httpCtx, "show", { localId: id });
    const relations = await request.validateUsing(this.relationValidator);
    const data = await this.model
      .query()
      .withScopes((scopes: ExtractScopes<T> & ScopesWithoutFirstArg<T>) => {
        scopes.preloadRelations(relations);
      })
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        () =>
          `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
      );
    await this.authorizeRecord(httpCtx, "show", data);
    return { data };
  }

  /**
   * Create a new object
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async store(httpCtx: HttpContext): Promise<unknown> {
    const { request, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.authenticate(httpCtx, "store");
    await this.selfValidate();

    let toStore = (await request.validateUsing(
      this.storeValidator,
    )) as PartialModel<T>;

    toStore =
      (await this.storeHook({
        http: httpCtx,
        model: this.model,
        request: toStore,
      })) ?? toStore;

    const result = await this.model.create(toStore).addErrorContext({
      message: "Failed to store object",
      code: "E_DB_ERROR",
      status: 500,
    });

    await result.refresh().addErrorContext({
      message: "Failed to fetch updated object",
      code: "E_DB_ERROR",
      status: 500,
    });

    await this.postStoreHook({
      http: httpCtx,
      model: this.model,
      request: toStore,
      record: result,
    }).addErrorContext({
      message: "Controller's postStoreHook threw an error",
      code: "E_INTERNAL_CONTROLLER_ERROR",
      status: 500,
    });

    return {
      success: true,
      data: result,
    };
  }

  protected async getFirstOrFail(id: string | number) {
    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    return await this.model
      .query()
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        () =>
          `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
      );
  }

  protected async saveOrFail(row: InstanceType<T>) {
    await row.save().addErrorContext({
      message: "Failed to commit updates",
      code: "E_DB_ERROR",
      status: 500,
    });
  }

  /**
   * Update an existing object
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async update(httpCtx: HttpContext): Promise<unknown> {
    const { request, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.authenticate(httpCtx, "update");
    await this.selfValidate();

    let id: string | number;
    if (this.singletonId !== undefined) {
      id = this.singletonId;
    } else {
      const { params } = (await request.validateUsing(
        this.pathIdValidator,
      )) as {
        params: { id: string | number };
      };
      id = params.id;
    }
    let updates = (await request.validateUsing(
      this.updateValidator,
    )) as PartialModel<T>;

    await this.authorizeById(httpCtx, "update", { localId: id });
    const row = await this.getFirstOrFail(id);
    await this.authorizeRecord(httpCtx, "update", row);
    updates =
      (await this.updateHook({
        http: httpCtx,
        model: this.model,
        record: row,
        request: updates,
      })) ?? updates;

    row.merge(updates);
    await this.saveOrFail(row);
    await row.refresh().addErrorContext({
      message: "Failed to fetch updated object",
      code: "E_DB_ERROR",
      status: 500,
    });

    return {
      success: true,
      data: row,
    };
  }

  /**
   * Delete an existing object
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async destroy(httpCtx: HttpContext): Promise<unknown> {
    const { request, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.authenticate(httpCtx, "destroy");
    await this.selfValidate();

    const {
      params: { id },
    } = (await request
      .validateUsing(this.pathIdValidator)
      .addErrorContext(() => {
        return {
          message: `Attempt to delete non existent ${this.model.name}`,
          code: "E_NOT_FOUND",
          status: 404,
        };
      })) as {
      params: { id: string | number };
    };

    await this.authorizeById(httpCtx, "destroy", { localId: id });

    const record = await this.getFirstOrFail(id);
    await this.authorizeRecord(httpCtx, "destroy", record);

    await this.destroyHook({
      http: httpCtx,
      model: this.model,
      record,
    });

    await record.delete().addErrorContext({
      message: "Failed to delete object",
      code: "E_DB_ERROR",
      status: 500,
    });

    return {
      success: true,
    };
  }

  /**
   * List related objects
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async relationIndex(httpCtx: HttpContext): Promise<unknown> {
    const { request, route } = httpCtx;
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);
    await this.authenticate(httpCtx, "relationIndex", relationName);

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };
    const relations = await request.validateUsing(
      this.subrelationValidator(relationName),
    );
    const { page, limit } = await request.validateUsing(paginationValidator);

    await this.authorizeById(httpCtx, "relationIndex", {
      localId: id,
      relationName,
    });
    const mainInstance = await this.getFirstOrFail(id);
    await this.authorizeRecord(httpCtx, "relationIndex", mainInstance);
    const relatedQuery = mainInstance
      .related(relationName as ExtractModelRelations<InstanceType<T>>)
      .query()
      .withScopes((scopes: ScopesWithoutFirstArg<LucidModel>) => {
        try {
          scopes.handleSearchQuery(request.qs());
        } catch {
          logger.warn(
            `handleSearchQuery query scope is not defined on ${this.model.name}'s '${relationName}' relation!`,
          );
        }
        try {
          scopes.preloadRelations(relations);
        } catch {
          logger.warn(
            `preloadRelations query scope is not defined on ${this.model.name}'s '${relationName}' relation!`,
          );
        }
        try {
          scopes.handleSortQuery(request.input("sort"));
        } catch {
          logger.warn(
            `handleSortQuery query scope is not defined on ${this.model.name}'s '${relationName}' relation!`,
          );
        }
      });

    if (page === undefined && limit === undefined) {
      return { data: await relatedQuery };
    }
    return await relatedQuery.paginate(page ?? 1, limit ?? 10);
  }

  /**
   * Create a related object for 1:n relations
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async oneToManyRelationStore(httpCtx: HttpContext): Promise<unknown> {
    const { request, route, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);
    await this.authenticate(httpCtx, "oneToManyRelationStore", relationName);

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };
    await this.authorizeById(httpCtx, "oneToManyRelationStore", {
      localId: id,
      relationName,
    });
    const toStore = (await request.validateUsing(
      this.relatedStoreValidator(relationName),
    )) as Partial<ModelAttributes<LucidRow>>;

    const mainInstance = await this.getFirstOrFail(id);
    await this.authorizeRecord(
      { request, route, auth } as unknown as HttpContext,
      "oneToManyRelationStore",
      mainInstance,
    );

    const relationClient = mainInstance.related(
      relationName as ExtractModelRelations<InstanceType<T>>,
    );
    if (relationClient.relation.type !== "hasMany") {
      throw new InternalControllerError(
        `Relation '${relationName}' of model '${this.model.name}' was passed into the 'oneToManyRelationStore' method, ` +
          `which only supports 'hasMany' relations, but this relation is of type '${relationClient.relation.type}'!`,
      );
    }
    const res = await (
      relationClient as HasManyClientContract<
        HasManyRelationContract<T, LucidModel>,
        LucidModel
      >
    )
      .create(toStore)
      .addErrorContext({
        message: "Failed to store object",
        code: "E_DB_ERROR",
        status: 500,
      });

    await res.refresh().addErrorContext({
      message: "Failed to fetch updated object",
      code: "E_DB_ERROR",
      status: 500,
    });

    return {
      success: true,
      data: res,
    };
  }

  async manyToManyRelationAttach(httpCtx: HttpContext): Promise<unknown> {
    const { request, route, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);
    await this.authenticate(httpCtx, "manyToManyRelationAttach", relationName);

    const {
      params: { localId, relatedId },
    } = (await request.validateUsing(
      this.manyToManyIdsValidator(relationName),
    )) as { params: { localId: string | number; relatedId: string | number } };
    const pivotProps = (await request.validateUsing(
      this.attachValidator(relationName),
    )) as Record<string, unknown>;

    await this.authorizeById(httpCtx, "manyToManyRelationAttach", {
      localId,
      relatedId,
      relationName,
    });

    const mainInstance = await this.getFirstOrFail(localId);
    await this.authorizeRecord(
      httpCtx,
      "manyToManyRelationAttach",
      mainInstance,
    );
    const relationClient = mainInstance.related(
      relationName as ExtractModelRelations<InstanceType<T>>,
    );
    if (relationClient.relation.type !== "manyToMany") {
      throw new InternalControllerError(
        `Relation '${relationName}' of model '${this.model.name}' was passed into the 'manyToManyRelationAttach' method, ` +
          `which only supports 'manyToMany' relations, but this relation is of type '${relationClient.relation.type}'!`,
      );
    }
    await (
      relationClient as ManyToManyClientContract<
        ManyToManyRelationContract<T, LucidModel>,
        LucidModel
      >
    )
      .attach({
        [relatedId]: pivotProps,
      })
      .addErrorContext({
        message: "Failed to attach object",
        code: "E_DB_ERROR",
        status: 500,
      });

    return { success: true };
  }

  async manyToManyRelationDetach(httpCtx: HttpContext): Promise<unknown> {
    const { request, route, auth } = httpCtx;
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);
    await this.authenticate(httpCtx, "manyToManyRelationDetach", relationName);

    const {
      params: { localId, relatedId },
    } = (await request.validateUsing(
      this.manyToManyIdsValidator(relationName),
    )) as { params: { localId: string | number; relatedId: string | number } };
    const detachFilters = (await request.validateUsing(
      this.detachValidator(relationName),
    )) as Record<string, unknown>;

    await this.authorizeById(httpCtx, "manyToManyRelationDetach", {
      localId,
      relatedId,
      relationName,
    });

    const relation = this.model.$relationsDefinitions.get(relationName);
    if (relation === undefined) {
      throw new InternalControllerError(
        `Relation '${relationName}' does not exist on model '${this.model.name}'`,
      );
    }
    if (relation.type !== "manyToMany") {
      throw new InternalControllerError(
        `Relation '${relationName}' of model '${this.model.name}' was passed into the 'manyToManyRelationDetach' method, ` +
          `which only supports 'manyToMany' relations, but this relation is of type '${relation.type}'!`,
      );
    }
    if (!relation.booted) {
      relation.boot();
    }

    // We can avoid fetching the main instance here since authorization was done pre-DB,
    // but still support row-level authorization hooks when overridden.
    if (this.authorizeRecord !== BaseController.prototype.authorizeRecord) {
      const mainInstance = await this.getFirstOrFail(localId);
      await this.authorizeRecord(
        httpCtx,
        "manyToManyRelationDetach",
        mainInstance,
      );
    }

    let result;
    try {
      result = await db
        .knexQuery()
        .table(relation.pivotTable)
        .where({
          ...detachFilters,
          [relation.pivotForeignKey]: localId,
          [relation.pivotRelatedForeignKey]: relatedId,
        })
        .delete();
    } catch (err) {
      throw new BaseError("Failed to detach objects", {
        cause: err,
        code: "E_DB_ERROR",
        status: 500,
      });
    }

    if (result === 0) {
      throw new NotFoundException("No relation attachments matched your query");
    }

    return { success: true, numDetached: result };
  }
}
