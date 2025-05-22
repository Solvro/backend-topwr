import { LucidModel } from "@adonisjs/lucid/types/model";
import { RelationshipsContract } from "@adonisjs/lucid/types/relations";

import { InvalidModelDefinition } from "#exceptions/model_autogen_errors";

/**
 * Helper function for quick relation defining with LucidModels
 *
 * Admin uses multiple form snake_case as resource names in relations.
 * If your resource is a usual noun, you can use this function to normalise it.
 * Otherwise, type the correct form yourself.
 * @returns Plural form of the normalized name of the resource
 * @example
 * const model = BicycleShower extends LucidModel; //model name = 'BicycleShower'
 * const normalized = anyCaseToPlural_snake_case(model);// normalized = 'bicycle_showers'
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function anyCaseToPlural_snake_case(model: LucidModel): string {
  const snakeCase = model.name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  if (snakeCase.endsWith("s")) {
    return `${snakeCase}es`;
  } else if (snakeCase.endsWith("y")) {
    return `${snakeCase.slice(0, -1)}ies`;
  }
  return `${snakeCase}s`;
}

/**
 * Helper function for quick relation defining with LucidModels
 *
 * Lucid uses multiple form camelCase as resource names in relations.
 * If your resource is a usual noun, you can use this function to normalise it.
 * Otherwise, type the correct form yourself.
 * @returns Plural form of the normalized name of the resource
 * @example
 * const model = BicycleShower extends LucidModel; //model name = 'BicycleShower'
 * const normalized = anyCaseToPlural_camelCase(model);// normalized = 'bicycleShowers'
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function anyCaseToPlural_camelCase(model: LucidModel): string {
  const camelCase = anyCaseToSingular_camelCase(model);
  if (camelCase.endsWith("s")) {
    return `${camelCase}es`;
  } else if (camelCase.endsWith("y")) {
    return `${camelCase.slice(0, -1)}ies`;
  }
  return `${camelCase}s`;
}

/**
 * Helper function for quick relation defining with LucidModels
 *
 * Lucid uses singular form camelCase as resource names in reference relations.
 * If your resource is a usual noun, you can use this function to normalise it.
 * Otherwise, type the correct form yourself.
 * @returns Normalized name of the resource
 * @example
 * const model = BicycleShower extends LucidModel; //model name = 'BicycleShower'
 * const normalized = anyCaseToSingular_camelCase(model);// normalized = 'bicycleShower'
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function anyCaseToSingular_camelCase(model: LucidModel): string {
  return model.name
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) =>
      char !== undefined ? char.toUpperCase() : "",
    )
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

function checkAndGetRelation(
  model: LucidModel,
  relationName: string,
): RelationshipsContract {
  const relation = model.$relationsDefinitions.get(relationName);
  if (relation === undefined) {
    throw new InvalidModelDefinition(
      `Relation '${relationName}' does not exist on model '${model.name}'.
       Available relations: ${Array.from(model.$relationsDefinitions.keys()).join(", ")}`,
    );
  }
  if (!relation.booted) {
    relation.boot();
  }
  return relation;
}

export function getOneToManyRelationForeignKey(
  model: LucidModel,
  relationName: string,
): string {
  const relation = checkAndGetRelation(model, relationName);
  if (relation.type === "hasMany" || relation.type === "belongsTo") {
    return relation.foreignKey;
  }
  throw new InvalidModelDefinition(
    `Relation '${relationName}' is not a one-to-many relation for model '${model.name}. It's a '${relation.type}' relation.`,
  );
}

export interface ManyToManyRelationKeys {
  joinKey: string;
  inverseJoinKey: string;
  pivotTableName: string;
}

export function getManyToManyRelationJoinKey(
  model: LucidModel,
  relationName: string,
): ManyToManyRelationKeys {
  const relation = checkAndGetRelation(model, relationName);
  if (relation.type !== "manyToMany") {
    throw new InvalidModelDefinition(
      `Relation '${relationName}' is not a many-to-many relation for model '${model.name}. It's a '${relation.type}' relation.`,
    );
  }
  //console.log(relation)
  return {
    joinKey: relation.pivotRelatedForeignKey,
    inverseJoinKey: relation.pivotForeignKey,
    pivotTableName: relation.pivotTable,
  };
}
