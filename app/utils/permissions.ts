import { getClassPath } from "@holoyan/adonisjs-permissions";

import logger from "@adonisjs/core/services/logger";
import db from "@adonisjs/lucid/services/db";
import type { LucidModel, LucidRow } from "@adonisjs/lucid/types/model";

/**
 * Breakdown of deleted rows per ACL table after a cleanup operation.
 */
export interface AclCleanupResult {
  permissions: number;
  roles: number;
  modelRoles: number;
  modelPermissions: number;
}

export function aclTotal(r: AclCleanupResult): number {
  return r.permissions + r.roles + r.modelRoles + r.modelPermissions;
}

const ZERO_RESULT: AclCleanupResult = {
  permissions: 0,
  roles: 0,
  modelRoles: 0,
  modelPermissions: 0,
};

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
 * Delete all ACL rows that reference a specific model instance.
 *
 * Cleans four tables (no foreign keys exist on `entity_id`, so this is required):
 * - `permissions`        — entity_type/entity_id scope (cascades to `model_permissions` via `permission_id` FK)
 * - `access_roles`       — entity_type/entity_id scope (cascades to `model_roles` via `role_id` FK)
 * - `model_roles`        — model_type/model_id  (role assignments *to* this entity)
 * - `model_permissions`  — model_type/model_id  (direct permission assignments *to* this entity)
 */
export async function deletePermissionsForEntity(
  entityType: string,
  entityId: number | string,
): Promise<AclCleanupResult> {
  const permissions = Number(
    await db
      .from("permissions")
      .where("entity_type", entityType)
      .where("entity_id", entityId)
      .delete(),
  );

  const roles = Number(
    await db
      .from("access_roles")
      .where("entity_type", entityType)
      .where("entity_id", entityId)
      .delete(),
  );

  const modelRoles = Number(
    await db
      .from("model_roles")
      .where("model_type", entityType)
      .where("model_id", entityId)
      .delete(),
  );

  const modelPermissions = Number(
    await db
      .from("model_permissions")
      .where("model_type", entityType)
      .where("model_id", entityId)
      .delete(),
  );

  const result: AclCleanupResult = {
    permissions,
    roles,
    modelRoles,
    modelPermissions,
  };
  const total = aclTotal(result);

  if (total > 0) {
    logger.info(
      `Deleted ${total} orphaned ACL row(s) for ${entityType}#${entityId}: ` +
        `${permissions} perm, ${roles} role, ` +
        `${modelRoles} model_role, ${modelPermissions} model_perm`,
    );
  }
  return result;
}

/**
 * Delete all ACL rows whose `entity_type`/`model_type` matches the given model,
 * but whose `entity_id`/`model_id` does not correspond to any existing row
 * in the model's table.
 *
 * Useful for bulk cleanup of ACL data that references deleted objects.
 */
export async function deleteOrphanedPermissionsForModel(
  model: LucidModel,
): Promise<AclCleanupResult> {
  const entityType = getMorphMapAlias(model);
  if (entityType === null) {
    return { ...ZERO_RESULT };
  }

  const existingIdSubquery = db.from(model.table).select(model.primaryKey);

  // entity_type/entity_id tables (permissions, access_roles)
  const deleteEntityOrphans = async (tableName: string): Promise<number> =>
    Number(
      await db
        .from(tableName)
        .where("entity_type", entityType)
        .whereNotNull("entity_id")
        .whereNotIn("entity_id", existingIdSubquery)
        .delete(),
    );

  // model_type/model_id tables (model_roles, model_permissions)
  const deleteModelOrphans = async (tableName: string): Promise<number> =>
    Number(
      await db
        .from(tableName)
        .where("model_type", entityType)
        .whereNotIn("model_id", existingIdSubquery)
        .delete(),
    );

  const permissions = await deleteEntityOrphans("permissions");
  const roles = await deleteEntityOrphans("access_roles");
  const modelRoles = await deleteModelOrphans("model_roles");
  const modelPermissions = await deleteModelOrphans("model_permissions");

  return { permissions, roles, modelRoles, modelPermissions };
}
