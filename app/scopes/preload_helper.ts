import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  LucidRow,
  ModelQueryBuilderContract,
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
 * @returns {QueryScope} A scope function that takes a query and a relations object.
 *
 * @example
 * const buildings = await Building.query()
 *  .withScopes((scopes) => {
 *    scopes.preloadRelations(request.only(["campus"]));
 */
export const preloadRelations = <T extends LucidModel>(model: T) =>
  scope(
    (
      query: ModelQueryBuilderContract<LucidModel, LucidRow>,
      relations: Partial<Record<string, string>>,
    ) => {
      for (const relation in relations) {
        const value = relations[relation];

        if (value === "1" || value === "true") {
          query = preloadSinglePath(query, model, relation.split("."));
        }
      }
      return query;
    },
  );

/**
 * Helper function to work with recursively looaded chained relations
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