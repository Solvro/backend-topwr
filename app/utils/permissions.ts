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
