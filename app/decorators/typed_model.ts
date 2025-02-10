import {
  ColumnOptions,
  LucidModel,
  ModelColumnOptions,
} from "@adonisjs/lucid/types/model";

type SharedColumnTypes = "string" | "number" | "boolean" | "DateTime";
export type ColumnType = SharedColumnTypes | "enum";
type InputColumnTypes = SharedColumnTypes | Record<string, string>; // Record<string, string> represents a runtime enum

export type TypedModelOptions = Record<string, InputColumnTypes>;

export interface ColumnDef extends ColumnOptions {
  meta?: {
    declaredType?: ColumnType;
    allowedValues?: string[];
  };
}

/**
 * Class decorator for injecting custom column types into a Lucid model.
 * ---------------------------------------------------------------------
 *
 * The `typedModel` decorator allows you to specify and inject custom types for model columns by
 *
 * adding type information to the `meta` property of each column definition.
 *
 * **Support for Enums**
 * - Enums are supported, provide an enum object as a value instead of string literal of a type
 * - such provided enum injects specified type and allowed values
 *
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
 * enum ICON {
 *   Icon = "ICON"
 * }
 *
 * \@typedModel({
 *   id: 'number',
 *   name: 'string',
 *   icon: ICON,
 *   createdAt: 'date',
 * })
 * export default class User extends BaseModel {
 *   \@column({ isPrimary: true })
 *   public id: number
 *
 *   \@column()
 *   public name: string
 *
 *   \@column()
 *   public icon: ICON
 *
 *   \@column.dateTime({ autoCreate: true })
 *   public createdAt: DateTime
 * }
 * ```
 *
 * @param {TypedModelOptions} options - An object where:
 *   - **Keys**: Match the column names defined in the model.
 *   - **Values**: Are types from the predefined `ColumnType` set (e.g., `'string'`, `'number'`, `'boolean'`, `'DateTime'`, **enum object**).
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
      if (typeof columnType === "string") {
        columnDef.meta.declaredType = columnType;
      } else {
        // enums
        columnDef.meta.declaredType = "enum";
        columnDef.meta.allowedValues = Object.values(columnType);
      }
    }
    return constructor;
  };
}
