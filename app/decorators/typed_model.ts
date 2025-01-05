import {
  ColumnOptions,
  LucidModel,
  ModelColumnOptions,
} from "@adonisjs/lucid/types/model";

export type ColumnType = "string" | "number" | "boolean" | "DateTime";

export type TypedModelOptions = Record<string, ColumnType>;

export interface ColumnDef extends ColumnOptions {
  meta?: {
    declaredType?: ColumnType;
  };
}

/**
 * Class decorator for injecting custom column types into a Lucid model.
 *
 * The `typedModel` decorator allows you to specify and inject custom types for model columns by
 * adding type information to the `meta` property of each column definition.
 *
 * **Prerequisites:**
 * - The model must extend `BaseModel` from AdonisJS Lucid ORM.
 * - Columns should be defined using column decorators (e.g., `@column`).
 *
 * @example
 * ```typescript
 * import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
 * import { typedModel } from 'path-to-decorator'
 *
 * @typedModel({
 *   id: 'number',
 *   name: 'string',
 *   createdAt: 'date',
 * })
 * export default class User extends BaseModel {
 *   @column({ isPrimary: true })
 *   public id: number
 *
 *   @column()
 *   public name: string
 *
 *   @column.dateTime({ autoCreate: true })
 *   public createdAt: DateTime
 * }
 * ```
 *
 * @param {TypedModelOptions} options - An object where:
 *   - **Keys**: Match the column names defined in the model.
 *   - **Values**: Are types from the predefined `ColumnType` set (e.g., `'string'`, `'number'`, `'boolean'`, `'DateTime'`).
 *
 */
export function typedModel<T extends LucidModel>(options: TypedModelOptions) {
  return function (constructor: T): T {
    const columns: Map<string, ModelColumnOptions> | undefined =
      constructor.$columnsDefinitions;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (columns === undefined) {
      console.error(
        `No $columnsDefinitions found on model ${constructor.name}. ` +
          `Check if any @column decorator is used on columns and/or if model extends BaseModel`,
      );
      return constructor;
    }

    for (const [propertyName, columnType] of Object.entries(options)) {
      const columnDef: ColumnDef | undefined = columns.get(propertyName);
      if (columnDef === undefined) {
        console.error(
          `Mismatch: no ${propertyName} found in ${constructor.name}`,
        );
        continue;
      }
      columnDef.meta = columnDef.meta ?? {};
      columnDef.meta.declaredType = columnType;
    }
    return constructor;
  };
}
