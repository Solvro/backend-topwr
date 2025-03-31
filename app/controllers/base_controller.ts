import vine, { VineBoolean, VineObject, VineValidator } from "@vinejs/vine";
import { OptionalModifier } from "@vinejs/vine/schema/base/literal";

import type { HttpContext } from "@adonisjs/core/http";
import {
  ExtractScopes,
  LucidModel,
  ModelQueryBuilderContract,
} from "@adonisjs/lucid/types/model";

import { BaseError } from "#exceptions/base_error";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";
import { paginationValidator } from "#validators/pagination";
import { showValidator } from "#validators/show";

interface Scopes<T extends LucidModel> {
  preloadRelations: ReturnType<typeof preloadRelations<T>>;
  handleSearchQuery: ReturnType<typeof handleSearchQuery<T>>;
  handleSortQuery: ReturnType<typeof handleSortQuery<T>>;
}

// Utility type that removes the first parameter from a function type
type ScopeMethod<F, M extends LucidModel> = F extends (
  arg1: ModelQueryBuilderContract<M>,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- that's how it is in the actual type, unknown just breaks things here :(
  undefined | Record<string, any>
>;

const selfValidationCache = new Map<
  LucidModel,
  Map<string, BaseError | null>
>();
const relationValidatorCache = new Map<string, RelationValidator>();

export default abstract class BaseController<T extends LucidModel & Scopes<T>> {
  protected abstract readonly relations: string[];
  protected abstract readonly model: T;

  protected get relationValidator(): RelationValidator {
    // check cache
    const cacheKey = JSON.stringify(this.relations);
    const cachedEntry = relationValidatorCache.get(cacheKey);
    if (cachedEntry !== undefined) {
      return cachedEntry;
    }

    // construct validator
    const validator = vine.compile(
      vine.object(
        Object.fromEntries(
          this.relations.map((rel) => [rel, vine.boolean().optional()]),
        ),
      ),
    );
    relationValidatorCache.set(cacheKey, validator);
    return validator;
  }

  /**
   * Verify that this controller was implemented correctly
   *
   * @throws when this controller was implemented incorrectly
   */
  protected async selfValidate() {
    // cache
    let modelValidationCache = selfValidationCache.get(this.model);
    if (modelValidationCache === undefined) {
      modelValidationCache = new Map();
      selfValidationCache.set(this.model, modelValidationCache);
    }
    const cacheKey = JSON.stringify(this.relations);
    const cachedEntry = modelValidationCache.get(cacheKey);
    if (cachedEntry !== undefined) {
      if (cachedEntry === null) {
        return;
      }
      throw cachedEntry;
    }

    const issues = [];

    // Verify scopes
    const requiredScopes = [
      "preloadRelations",
      "handleSearchQuery",
      "handleSortQuery",
    ];
    // minor amount of trolling for the adonis ORM
    // implementation note: you cannot pass the scopes object directly to the resolve func
    //   because the resolve func attempts to await the passed params by attempting to call .then(),
    //   which adonis does not like
    const { smuggledScopes } = await new Promise<{
      smuggledScopes: Record<string, unknown>;
    }>((res) =>
      this.model
        .query()
        .withScopes((scopes) => res({ smuggledScopes: scopes })),
    );
    for (const scope of requiredScopes) {
      if (!(scope in this.model)) {
        issues.push(`'${scope}' scope does not exist on the model`);
        continue;
      }
      try {
        // adonis will throw an error here if it's not a valid scope
        void smuggledScopes[scope];
      } catch {
        issues.push(
          `'${scope}' scope does not exist on the object passed to the this.model.query().withScopes() callback`,
        );
      }
    }

    // Verify relations
    for (const relationDef of this.relations) {
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

    if (issues.length !== 0) {
      const error = new BaseError(
        "Internal controller implementation validation failed",
        {
          messages: issues,
          code: "E_INTERNAL_CONTROLLER_VALIDATION_ERROR",
          status: 500,
        },
      );
      modelValidationCache.set(cacheKey, error);
      throw error;
    }
    modelValidationCache.set(cacheKey, null);
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
    } = await request.validateUsing(showValidator);
    const relations = await request.validateUsing(this.relationValidator);

    return {
      data: await this.model
        .query()
        .withScopes((scopes: ExtractScopes<T> & ScopesWithoutFirstArg<T>) => {
          scopes.preloadRelations(relations);
        })
        .where("id", id)
        .firstOrFail()
        .addErrorContext(
          () => `${this.model.name} with ID ${id} does not exist`,
        ),
    };
  }
}
