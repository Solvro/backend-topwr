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

const validationCache = new Map<LucidModel, Map<string, BaseError | null>>();

export default abstract class BaseController<T extends LucidModel & Scopes<T>> {
  protected abstract readonly relations: string[];
  protected abstract readonly model: T;

  /**
   * Verify that this controller was implemented correctly
   *
   * @throws when this controller was implemented incorrectly
   */
  protected async selfValidate() {
    // cache
    let modelValidationCache = validationCache.get(this.model);
    if (modelValidationCache === undefined) {
      modelValidationCache = new Map();
      validationCache.set(this.model, modelValidationCache);
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
    const baseQuery = this.model
      .query()
      .withScopes((scopes: ExtractScopes<T> & ScopesWithoutFirstArg<T>) => {
        scopes.handleSearchQuery(request.qs());
        scopes.preloadRelations(request.only(this.relations));
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
