import adonisString from "@poppinss/utils/string";
import vine, { VineBoolean, VineObject, VineValidator } from "@vinejs/vine";
import { OptionalModifier } from "@vinejs/vine/schema/base/literal";
import { SchemaTypes } from "@vinejs/vine/types";
import assert from "node:assert";

import type { HttpContext } from "@adonisjs/core/http";
import logger from "@adonisjs/core/services/logger";
import router from "@adonisjs/core/services/router";
import { Constructor } from "@adonisjs/core/types/container";
import { LazyImport, StoreRouteNode } from "@adonisjs/core/types/http";
import {
  ExtractScopes,
  LucidModel,
  LucidRow,
  ModelAttributes,
  ModelColumnOptions,
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
  ValidatedColumnDef,
  validateColumnDef,
  validateTypedManyToManyRelation,
} from "#decorators/typed_model";
import {
  InternalControllerError,
  InternalControllerValidationError,
} from "#exceptions/base_controller_errors";
import { NotFoundException } from "#exceptions/http_exceptions";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";
import "#utils/maps";
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

type RelationValidator = VineValidator<
  VineObject<
    Record<string, OptionalModifier<VineBoolean>>,
    Record<string, string | number | boolean | null | undefined>,
    Record<string, boolean | undefined>,
    Record<string, boolean | undefined>
  >,
  [undefined]
>;
type AnyValidator = VineValidator<SchemaTypes, [undefined]>;

interface PrimaryKeyFieldDescriptor {
  fieldName: string;
  columnOptions: ValidatedColumnDef;
}

interface AutogenCacheEntry {
  // keyed by json-encoded list of relations
  selfValidation: Map<string, InternalControllerValidationError | null>;
  primaryKeyField: PrimaryKeyFieldDescriptor | InternalControllerError;
  // i give up on properly typing these validators
  pathIdValidator: AnyValidator;
  storeValidator: AnyValidator;
  updateValidator: AnyValidator;
  // indexed by relation name
  relationStoreValidators: Map<string, AnyValidator>;
  relationAttachValidators: Map<string, AnyValidator>;
  manyToManyIdValidators: Map<string, AnyValidator>;
}

const relationValidatorCache = new Map<string, RelationValidator>();
const modelAutogenCache = new Map<LucidModel, Partial<AutogenCacheEntry>>();

function relationValidator(relations: string[]): RelationValidator {
  // check cache
  const cacheKey = JSON.stringify(relations);
  const cachedEntry = relationValidatorCache.get(cacheKey);
  if (cachedEntry !== undefined) {
    return cachedEntry;
  }

  // construct validator
  const validator = vine.compile(
    vine.object(
      Object.fromEntries(
        relations.map((rel) => [rel, vine.boolean().optional()]),
      ),
    ),
  );
  relationValidatorCache.set(cacheKey, validator);
  return validator;
}

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
  #modelCacheEntry?: Partial<AutogenCacheEntry>;

  private get modelCacheEntry(): Partial<AutogenCacheEntry> {
    this.#modelCacheEntry ??= modelAutogenCache.getOrInsert(this.model, {});
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
    // check cache
    if (
      this.modelCacheEntry.primaryKeyField instanceof InternalControllerError
    ) {
      throw this.modelCacheEntry.primaryKeyField;
    } else if (this.modelCacheEntry.primaryKeyField !== undefined) {
      return this.modelCacheEntry.primaryKeyField;
    }

    // attempt to find the primary key field
    let primaryKeyField: PrimaryKeyFieldDescriptor | undefined;
    for (const [name, field] of this.model.$columnsDefinitions.entries()) {
      if (!field.isPrimary) {
        continue;
      }
      if (primaryKeyField !== undefined) {
        this.modelCacheEntry.primaryKeyField = new InternalControllerError(
          `Model '${this.model.name}' has more than one primary key field!`,
        );
        throw this.modelCacheEntry.primaryKeyField;
      }
      primaryKeyField = {
        fieldName: name,
        columnOptions: field as ValidatedColumnDef,
      };
    }

    this.modelCacheEntry.primaryKeyField =
      primaryKeyField ??
      new InternalControllerError(
        `Model '${this.model.name}' has no primary key field!`,
      );
    if (
      this.modelCacheEntry.primaryKeyField instanceof InternalControllerError
    ) {
      throw this.modelCacheEntry.primaryKeyField;
    }
    return this.modelCacheEntry.primaryKeyField;
  }

  protected get pathIdValidator(): AnyValidator {
    this.modelCacheEntry.pathIdValidator ??= vine.compile(
      vine.object({
        params: vine.object({
          id: this.primaryKeyField.columnOptions.meta.validator,
        }),
      }),
    );

    return this.modelCacheEntry.pathIdValidator;
  }

  protected get storeValidator(): AnyValidator {
    this.modelCacheEntry.storeValidator ??= vine.compile(
      vine.object(
        Object.fromEntries(
          this.model.$columnsDefinitions
            .entries()
            .map((value: [string, ModelColumnOptions]) => {
              const [name, field] = value as [string, ValidatedColumnDef];
              if (field.meta.autoGenerated) {
                return undefined;
              }
              return [name, field.meta.validator] as [string, SchemaTypes];
            })
            .filter((e) => e !== undefined),
        ),
      ),
    );

    return this.modelCacheEntry.storeValidator;
  }

  protected get updateValidator(): AnyValidator {
    this.modelCacheEntry.updateValidator ??= vine.compile(
      vine.object(
        Object.fromEntries(
          this.model.$columnsDefinitions
            .entries()
            .map((value: [string, ModelColumnOptions]) => {
              const [name, field] = value as [string, ValidatedColumnDef];
              if (field.meta.autoGenerated) {
                return undefined;
              }
              let validator = field.meta.validator;
              if (
                "optional" in validator &&
                typeof validator.optional === "function"
              ) {
                validator = (validator.optional as () => SchemaTypes)();
              }
              return [name, validator] as [string, SchemaTypes];
            })
            .filter((e) => e !== undefined),
        ),
      ),
    );

    return this.modelCacheEntry.updateValidator;
  }

  protected relatedStoreValidator(relationName: string): AnyValidator {
    this.modelCacheEntry.relationStoreValidators ??= new Map();
    return this.modelCacheEntry.relationStoreValidators.getOrInsertWith(
      relationName,
      () => {
        const relation = this.model.$relationsDefinitions.get(relationName);
        if (relation === undefined) {
          throw new InternalControllerError(
            `Relation '${relationName}' does not exist on model '${this.model.name}'`,
          );
        }
        if (!relation.booted) {
          relation.boot();
        }
        const foreignKey =
          relation.type === "hasMany" ? relation.foreignKey : undefined;
        return vine.compile(
          vine.object(
            Object.fromEntries(
              relation
                .relatedModel()
                .$columnsDefinitions.entries()
                .map((value: [string, ModelColumnOptions]) => {
                  const [name, field] = value as [string, ValidatedColumnDef];
                  if (field.meta.autoGenerated || name === foreignKey) {
                    return undefined;
                  }
                  return [name, field.meta.validator] as [string, SchemaTypes];
                })
                .filter((e) => e !== undefined),
            ),
          ),
        );
      },
    );
  }

  protected attachValidator(relationName: string): AnyValidator {
    this.modelCacheEntry.relationAttachValidators ??= new Map();
    return this.modelCacheEntry.relationAttachValidators.getOrInsertWith(
      relationName,
      () => {
        const relation = this.model.$relationsDefinitions.get(relationName);
        if (relation === undefined) {
          throw new InternalControllerError(
            `Relation '${relationName}' does not exist on model '${this.model.name}'`,
          );
        }
        if (relation.type !== "manyToMany") {
          throw new InternalControllerError(
            `Relation '${relationName}' is not a manyToMany relation!`,
          );
        }
        if (!validateTypedManyToManyRelation(relation)) {
          throw new InternalControllerError(
            `Relation '${relationName}' isn't properly typed!`,
          );
        }
        if (!relation.booted) {
          relation.boot();
        }
        return vine.compile(
          vine.object(
            Object.fromEntries(
              Object.entries(relation.options.meta.declaredColumnTypes)
                .map(([name, field]) => {
                  if (field.autoGenerated) {
                    return undefined;
                  }
                  return [name, field.validator];
                })
                .filter((e) => e !== undefined),
            ),
          ),
        );
      },
    );
  }

  protected manyToManyIdsValidator(relationName: string): AnyValidator {
    this.modelCacheEntry.manyToManyIdValidators ??= new Map();
    return this.modelCacheEntry.manyToManyIdValidators.getOrInsertWith(
      relationName,
      () => {
        const relation = this.model.$relationsDefinitions.get(relationName);
        if (relation === undefined) {
          throw new InternalControllerError(
            `Relation '${relationName}' does not exist on model '${this.model.name}'`,
          );
        }
        if (relation.type !== "manyToMany") {
          throw new InternalControllerError(
            `Relation '${relationName}' is not a manyToMany relation!`,
          );
        }
        if (!validateTypedManyToManyRelation(relation)) {
          throw new InternalControllerError(
            `Relation '${relationName}' isn't properly typed!`,
          );
        }
        if (!relation.booted) {
          relation.boot();
        }
        const relatedField = relation
          .relatedModel()
          .$columnsDefinitions.get(relation.relatedKey);
        if (relatedField === undefined) {
          throw new InternalControllerError(
            `Related key in relation '${relationName}' ('${relation.relatedKey}') doesn't exist on the related model!`,
          );
        }
        if (!validateColumnDef(relatedField)) {
          throw new InternalControllerError(
            `Related key in relation '${relationName}' ('${relation.relatedKey}') isn't properly typed!`,
          );
        }
        return vine.compile(
          vine.object({
            params: vine.object({
              localId: this.primaryKeyField.columnOptions.meta.validator,
              relatedId: (relatedField as ValidatedColumnDef).meta.validator,
            }),
          }),
        );
      },
    );
  }

  /**
   * Verify that this controller was implemented correctly
   *
   * @throws when this controller was implemented incorrectly
   */
  protected async selfValidate() {
    // cache
    this.modelCacheEntry.selfValidation ??= new Map();

    const relationCacheKey = JSON.stringify(this.queryRelations);
    const relationCachedEntry =
      this.modelCacheEntry.selfValidation.get(relationCacheKey);
    if (relationCachedEntry !== undefined) {
      if (relationCachedEntry === null) {
        return;
      }
      throw relationCachedEntry;
    }

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
      assert(error instanceof InternalControllerError);
      issues.push(error.message);
    }

    if (issues.length !== 0) {
      const error = new InternalControllerValidationError(issues);
      this.modelCacheEntry.selfValidation.set(relationCacheKey, error);
      throw error;
    }
    this.modelCacheEntry.selfValidation.set(relationCacheKey, null);
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
          .post(`/:id/${snakeCaseName}`, [controller, "oneToManyRelationStore"])
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
    if (page === undefined) {
      return { data: await baseQuery };
    }
    return await baseQuery.paginate(page, limit ?? 10);
  }

  /**
   * Show individual record
   *
   * Return type set to Promise<unknown> to allow for method overrides
   */
  async show({ request }: HttpContext): Promise<unknown> {
    await this.selfValidate();

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };

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
  async store({ request, auth }: HttpContext): Promise<unknown> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();

    const result = await this.model.create(
      (await request.validateUsing(this.storeValidator)) as Partial<
        ModelAttributes<InstanceType<T>>
      >,
    );

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
  async update({ request, auth }: HttpContext): Promise<unknown> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await this.selfValidate();

    const {
      params: { id },
    } = (await request.validateUsing(this.pathIdValidator)) as {
      params: { id: string | number };
    };
    const updates = (await request.validateUsing(
      this.updateValidator,
    )) as Partial<ModelAttributes<InstanceType<T>>>;

    const primaryColumnName = this.primaryKeyField.columnOptions.columnName;
    const row = await this.model
      .query()
      .where(primaryColumnName, id)
      .firstOrFail()
      .addErrorContext(
        () =>
          `${this.model.name} with '${primaryColumnName}' = '${id}' does not exist`,
      );

    row.merge(updates);
    await row.save().addErrorContext({
      message: "Failed to commit updates",
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
  async destroy({ request, auth }: HttpContext): Promise<unknown> {
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

    if (page === undefined) {
      return { data: await relatedQuery };
    }
    return await relatedQuery.paginate(page, limit ?? 10);
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
    ).create(toStore);

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
    ).attach({
      [relatedId]: pivotProps,
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
        `Relation '${relationName}' of model '${this.model.name}' was passed into the 'manyToManyRelationDetach' method, ` +
          `which only supports 'manyToMany' relations, but this relation is of type '${relationClient.relation.type}'!`,
      );
    }
    await (
      relationClient as ManyToManyClientContract<
        ManyToManyRelationContract<T, LucidModel>,
        LucidModel
      >
    ).detach([relatedId]);

    return { success: true };
  }
}
