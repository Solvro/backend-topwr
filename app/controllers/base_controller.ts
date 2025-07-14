import adonisString from "@poppinss/utils/string";
import assert from "node:assert";

import { HttpContext } from "@adonisjs/core/http";
import logger from "@adonisjs/core/services/logger";
import router from "@adonisjs/core/services/router";
import { Constructor } from "@adonisjs/core/types/container";
import { LazyImport, StoreRouteNode } from "@adonisjs/core/types/http";
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
import { BaseError } from "#exceptions/base_error";
import { NotFoundException } from "#exceptions/http_exceptions";
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

interface Scopes<T extends LucidModel> {
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
  static async configureRoutes<T extends LucidModel & Scopes<LucidModel>>(
    controller: LazyImport<Constructor<BaseController<T>>>,
  ): Promise<() => void> {
    const imported = await controller();
    const Controller = imported.default;
    const instance = new Controller();
    if (!(instance instanceof BaseController)) {
      throw new Error(
        `Attempted to configure routes for a non-BaseController-based controller: ${Controller.name}`,
      );
    }
    return instance.$configureRoutes.bind(instance, controller);
  }

  /**
   * Generates a configuration callback that configures each of the named controllers
   */
  static async configureByNames(names: string[]): Promise<() => void> {
    const toConfigure: [string, () => void][] = await Promise.all(
      names.map(async (name) => {
        const controller = (async () =>
          await import(`#controllers/${name}_controller`)) as LazyImport<
          Constructor<BaseController<LucidModel & Scopes<LucidModel>>>
        >;
        return [name, await BaseController.configureRoutes(controller)];
      }),
    );
    return () => {
      for (const [name, config] of toConfigure) {
        router.group(config).prefix(`/${name}`).as(name);
      }
    };
  }

  /**
   * Configures routes for this controller when passed as the group callback
   */
  $configureRoutes(controller: LazyImport<Constructor<BaseController<T>>>) {
    if (this.singletonId === undefined) {
      // basic routes
      router.get("/", [controller, "index"]).as("index");
      router.post("/", [controller, "store"]).as("store");
      router.get("/:id", [controller, "show"]).as("show");
      router.delete("/:id", [controller, "destroy"]).as("destroy");
      router.patch("/:id", [controller, "update"]).as("update");

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
      router.get("/", [controller, "show"]).as("show");
      router.patch("/", [controller, "update"]).as("update");
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
  async index({ request }: HttpContext): Promise<unknown> {
    await this.selfValidate();
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
  async show({ request }: HttpContext): Promise<unknown> {
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

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const relations = await request.validateUsing(this.relationValidator);

    return {
      data: await this.model
        .query()
        .withScopes((scopes: ExtractScopes<T> & ScopesWithoutFirstArg<T>) => {
          scopes.preloadRelations(relations);
        })
        .where(primaryColumnName, id)
        .firstOrFail()
        .addErrorContext(
          () =>
            `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
        ),
    };
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

    return {
      success: true,
      data: result,
    };
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

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const row = await this.model
      .query()
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        () =>
          `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
      );

    updates =
      (await this.updateHook({
        http: httpCtx,
        model: this.model,
        record: row,
        request: updates,
      })) ?? updates;

    row.merge(updates);
    await row.save().addErrorContext({
      message: "Failed to commit updates",
      code: "E_DB_ERROR",
      status: 500,
    });
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
    await this.selfValidate();

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;

    // smol opt: we know the base destroyHook does nothing, so just don't fetch the model if noone overwrote it
    if (this.destroyHook !== BaseController.prototype.destroyHook) {
      const record = await this.model
        .query()
        .where(primaryColumnName, id)
        .firstOrFail()
        .addErrorContext(
          () =>
            `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
        );

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
    } else {
      const result = await this.model
        .query()
        .where(primaryColumnName, id)
        .delete()
        .limit(1)
        .returning(primaryColumnName);

      if (result.length === 0) {
        throw new NotFoundException(
          `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
          { code: "E_ROW_NOT_FOUND", cause: "Row not found" },
        );
      }
    }

    return {
      success: true,
    };
  }

  /**
   * List related objects
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async relationIndex({ request, route }: HttpContext): Promise<unknown> {
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };
    const relations = await request.validateUsing(
      this.subrelationValidator(relationName),
    );
    const { page, limit } = await request.validateUsing(paginationValidator);

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const mainInstance = await this.model
      .query()
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
      );
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
  async oneToManyRelationStore({
    request,
    route,
    auth,
  }: HttpContext): Promise<unknown> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };
    const toStore = (await request.validateUsing(
      this.relatedStoreValidator(relationName),
    )) as Partial<ModelAttributes<LucidRow>>;

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const mainInstance = await this.model
      .query()
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
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

  async manyToManyRelationAttach({
    request,
    route,
    auth,
  }: HttpContext): Promise<unknown> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);

    const {
      params: { localId, relatedId },
    } = (await request.validateUsing(
      this.manyToManyIdsValidator(relationName),
    )) as { params: { localId: string | number; relatedId: string | number } };
    const pivotProps = (await request.validateUsing(
      this.attachValidator(relationName),
    )) as Record<string, unknown>;

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const mainInstance = await this.model
      .query()
      .where(primaryColumnName, localId)
      .firstOrFail()
      .addErrorContext(
        `${this.model.name} with '${primaryColumnName}' = '${localId}' does not exist`,
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

  async manyToManyRelationDetach({
    request,
    route,
    auth,
  }: HttpContext): Promise<unknown> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();
    const relationName = this.relationNameFromRoute(route);

    const {
      params: { localId, relatedId },
    } = (await request.validateUsing(
      this.manyToManyIdsValidator(relationName),
    )) as { params: { localId: string | number; relatedId: string | number } };
    const detachFilters = (await request.validateUsing(
      this.detachValidator(relationName),
    )) as Record<string, unknown>;

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
