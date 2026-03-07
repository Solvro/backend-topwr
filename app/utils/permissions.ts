import { getClassPath } from "@holoyan/adonisjs-permissions";

import logger from "@adonisjs/core/services/logger";
import db from "@adonisjs/lucid/services/db";
import { LucidModel, LucidRow } from "@adonisjs/lucid/types/model";

/**
 * Creates a fake model instance for the purpose of efficient permission checking
 *
 * The returned object can be passed in as a target of permission check functions.
 * It implements the bare minimum that `@holoyan/adonisjs-permissions` requires,
 * while not needing to fetch the model from the database.
 *
 * @param model the type of "thin model" to create
 * @param id the id of the "thin model" instance to create
 * @returns a fake instance of the requested model
 */
export function thinModel(model: LucidModel, id: number): ThinModel & LucidRow {
  return new Proxy(
    { model, id, getModelId: thinModelGetId },
    thinModelHandlers,
  ) as ThinModel & LucidRow;
}

interface ThinModel {
  model: LucidModel;
  id: number;
  getModelId(): number;
}
const thinModelHandlers: ProxyHandler<ThinModel> = {
  setPrototypeOf: () => false,
  preventExtensions: () => false,
  defineProperty: () => false,
  set: () => false,
  deleteProperty: () => false,
  getPrototypeOf: (target) => Reflect.get(target, "model").prototype,
};
function thinModelGetId(this: ThinModel): number {
  return this.id;
}

/**
 * Check whether a model class has a morph map registered (i.e. supports ACL permissions).
 *
 * @param model the model class to check
 * @returns the morph map alias if registered, or null otherwise
 */
export function getMorphMapAlias(model: LucidModel): string | null {
  try {
    return getClassPath(model);
  } catch {
    return null;
  }
}

/**
 * Delete all permission rows whose `entity_type` and `entity_id` point to a specific model instance.
 *
 * This cascades to `model_permissions` (pivot) via the ON DELETE CASCADE foreign key.
 *
 * @param entityType the morph map alias of the model (e.g. "guide_articles")
 * @param entityId the id of the deleted instance
 * @returns the number of deleted permission rows
 */
export async function deletePermissionsForEntity(
  entityType: string,
  entityId: number | string,
): Promise<number> {
  const result = await db
    .from("permissions")
    .where("entity_type", entityType)
    .where("entity_id", entityId)
    .delete();

  const deletedCount = Number(result);

  if (deletedCount > 0) {
    logger.info(
      `Deleted ${deletedCount} orphaned permission(s) for ${entityType}#${entityId}`,
    );
  }
  return deletedCount;
}

/**
 * Delete all permission rows whose `entity_type` matches, but whose `entity_id`
 * does not correspond to any existing row in the model's table.
 *
 * Useful for bulk cleanup of permissions that reference deleted objects.
 *
 * @param model the model class to clean up permissions for
 * @returns the number of deleted permission rows
 */
export async function deleteOrphanedPermissionsForModel(
  model: LucidModel,
): Promise<number> {
  const entityType = getMorphMapAlias(model);
  if (entityType === null) {
    return 0;
  }

  const table = model.table;
  const primaryKey = model.primaryKey;

  // Fetch current IDs from the model table to avoid subquery type-casting issues
  const existingRows = (await db.from(table).select(primaryKey)) as Record<
    string,
    unknown
  >[];
  const existingIds = existingRows.map((row) => row[primaryKey] as number);

  // Base query: permissions scoped to this entity type at instance level
  let query = db
    .from("permissions")
    .where("entity_type", entityType)
    .whereNotNull("entity_id");

  // Exclude currently-existing IDs if any are present.
  // If empty, all instance-scoped permissions are orphaned — delete all.
  if (existingIds.length > 0) {
    query = query.whereNotIn("entity_id", existingIds);
  }

  const result = await query.delete();

  return Number(result);
}
