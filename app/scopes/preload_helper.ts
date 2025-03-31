import logger from "@adonisjs/core/services/logger";
import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  ModelQueryBuilderContract,
  QueryScope,
} from "@adonisjs/lucid/types/model";
import { ExtractModelRelations } from "@adonisjs/lucid/types/relations";

/**
 * Preloads specified relations on a Lucid model query.
 *
 * The returned scope function accepts an object where:
 * - **Keys** are relation names, which can be nested using dot notation (e.g., `'campus.building'`).
 * - **Values** are booleans indicating whether to preload the corresponding relation.
 *
 * @template T - Type of the Lucid model.
 * @param {T} model - The Lucid model to preload relations on.
 * @returns **QueryScope** A scope function that takes a query and a relations object.
 *
 * @example
 * const buildings = await Building.query()
 *  .withScopes((scopes) => {
 *    scopes.preloadRelations(request.only(["campus"]));
 *  });
 */
export function preloadRelations<T extends LucidModel>(
  model: T,
): QueryScope<
  T,
  (
    query: ModelQueryBuilderContract<T>,
    relations: Partial<Record<string, boolean>>,
  ) => void
> {
  return scope((query, relations) => {
    for (const [relation, value] of Object.entries(relations)) {
      if (value === true) {
        query = preloadSinglePath(query, model, relation.split("."));
      }
    }
  });
}

/**
 * Helper function to work with recursively loaded chained relations
 * - Base case [1] of function is the exhaustion of relationParts array (stack)
 * - Base case [2] of function is the mismatch in provided relation name
 *
 * @param query - current query to work on
 * @param {T} model - The Lucid model to validate NEXT related model preload
 * @param relationParts - array that holds further chained relations that remain to be loaded in that single path
 * @returns {ModelQueryBuilderContract<T>} query to chain other queries on
 */
function preloadSinglePath<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  model: T,
  relationParts: string[],
): ModelQueryBuilderContract<T> {
  const relation = relationParts.shift();
  if (relation === undefined) {
    return query;
  }

  const relationDefinition = model.$relationsDefinitions.get(relation);
  if (relationDefinition === undefined) {
    logger.warn(`'${relation}' relation not defined in '${model.name}' model`);
    return query;
  }

  query = query.preload(
    relation as ExtractModelRelations<InstanceType<T>>,
    (nestedQuery: ModelQueryBuilderContract<T>) => {
      void preloadSinglePath(
        nestedQuery,
        relationDefinition.relatedModel(),
        relationParts,
      );
    },
  );

  return query;
}
