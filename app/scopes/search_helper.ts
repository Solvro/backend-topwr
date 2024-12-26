import { DateTime } from "luxon";

import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  LucidRow,
  ModelAttributes,
  ModelColumnOptions,
  ModelQueryBuilderContract,
} from "@adonisjs/lucid/types/model";

import BadRequestException from "#exceptions/bad_request_exception";
import ColumnTypeNotImplementedException from "#exceptions/column_type_not_implemented_exception";
import NotImplementedException from "#exceptions/not_implemented_exception";

import { ColumnDef } from "../decorators/typed_model.js";

/**
 *
 * Thanks to Dawid Linek for concept
 *
 */

export interface FromTo {
  from?: string;
  to?: string;
}
export type QueryValues =
  | string
  | number
  | boolean
  | DateTime
  | string[]
  | number[]
  | boolean[]
  | DateTime[];

/**
 * Based on object of params filter query including in, from, to, like options
 *
 * @param {T} model - The Lucid model instance.
 * @returns {LucidQueryScope<T>} - A Lucid query scope function.
 *
 * The returned scope function takes an object where:
 * - **keys** are model column name
 * - **values** are query string values of shape:
 * - - **string**
 * - - **string[]**
 * - - **{ from?: string, to?: string }**
 *
 * Filtering request is validated based on column type defined in `meta` property of each column definition.
 * Column type needs to match the ColumnType type defined in **@typedModel** decorator
 *
 * **Supported Column Types:**
 * - **string**: Direct match or pattern-based filtering.
 * - **number**: Numeric comparisons (`=`, `>=`, `<=`).
 * - **boolean**: Matches `true`, `false`, `1`, or `0`.
 * - **DateTime**: Filters JS date/time values for exact or range-based filtering.
 *
 * **Asumptions**
 * - invalid type input will result in BadRequest response
 * - not defined type on column will result in NotImplemented response (501)
 * - [from]/[to] filtering applies only to numeric or date columns
 * - empty string value for filtering param is ignored
 * - filtering param non existend in model columns is ignored
 *
 * **Usage:**
 * ```typescript
 * // campus controller example
 * const campuses = await Campus.query().withScopes((scopes) => {
 *  scopes.handleSearchQuery(
 *    request.only(["id", "name", "createdAt", "updatedAt"]))
 * ```
 *
 * **NOTE**
 *  - Consider using **@TypedModel** decorator on model to inject type property into every column easily
 */
export const handleSearchQuery = <T extends LucidModel>(model: T) =>
  scope(
    (
      query,
      params: Partial<
        Record<
          keyof ModelAttributes<InstanceType<T>>,
          undefined | string | string[] | FromTo
        >
      >,
    ) => {
      for (const param in params) {
        const value: string | string[] | FromTo | undefined = params[param];
        const column = model.$getColumn(param);
        if (value === undefined || column === undefined) {
          // empty string will not pass
          continue;
        } else if (Array.isArray(value)) {
          query = handleArray(query, column, value);
        } else if (typeof value === "object") {
          query = handleFromTo(query, column, value);
        } else {
          query = handleDirectValue(query, column, value);
        }
      }
    },
  );

function handleArray(
  query: ModelQueryBuilderContract<LucidModel, LucidRow>,
  column: ModelColumnOptions,
  values: string[],
) {
  const columnType = extractType(column);
  const invalid = arrayTypeCheckHelper(values, columnType);
  if (invalid.length > 0) {
    throw new BadRequestException(
      `Invalid filter values:[${invalid.toString()}] ` +
        `for column: '${column.columnName}' ` +
        `of type: '${columnType}'`,
    );
  } else {
    const valid = values.filter((val) => val);
    if (valid.length > 0) {
      query = query.whereIn(column.columnName, valid);
    }
  }
  return query;
}

function handleFromTo(
  query: ModelQueryBuilderContract<LucidModel, LucidRow>,
  column: ModelColumnOptions,
  value: FromTo,
) {
  const columnType = extractType(column);
  if (columnType !== "number" && columnType !== "DateTime") {
    // [from]/[to] make sense only on number or date
    throw new BadRequestException(
      `Can't filter 'from'/'to' on types other than 'number'/'DateTime'. ` +
        `Type of '${column.columnName}' is '${columnType}'`,
    );
  } else {
    // verify using the same logic as for array of values
    // both values are optional
    const values = [value.from, value.to];
    const invalid = arrayTypeCheckHelper(values, columnType);
    if (invalid.length > 0) {
      const invalidFrom = invalid.find((val) => val === value.from);
      const invalidTo = invalid.find((val) => val === value.to);
      const invalidParts: string[] = [];
      if (invalidFrom !== undefined) {
        invalidParts.push(`'[from]=${invalidFrom}'`);
      }
      if (invalidTo !== undefined) {
        invalidParts.push(`'[to]=${invalidTo}'`);
      }
      const invalidMessage = invalidParts.join(" and ");
      throw new BadRequestException(
        `invalid filter value(s) ${invalidMessage} ` +
          `for column: '${column.columnName}' ` +
          `of type: '${columnType}'`,
      );
    }
    if (columnType === "number") {
      if (value.from !== undefined) {
        query = query.where(column.columnName, ">=", Number(value.from));
      }
      if (value.to !== undefined) {
        query = query.where(column.columnName, "<=", Number(value.to));
      }
    } else {
      if (value.from !== undefined) {
        const fromDate = new Date(value.from);
        query = query.where(column.columnName, ">=", fromDate);
      }
      if (value.to !== undefined) {
        const toDate = new Date(value.to);
        query = query.where(column.columnName, "<=", toDate);
      }
    }
  }
  return query;
}

function handleDirectValue(
  query: ModelQueryBuilderContract<LucidModel, LucidRow>,
  column: ModelColumnOptions,
  value: string,
) {
  const columnType = extractType(column);
  const invalid = arrayTypeCheckHelper([value], columnType);
  if (invalid.length > 0) {
    throw new BadRequestException(
      `invalid filter value '${value}' ` +
        `for column: '${column.columnName}' ` +
        `of type: '${columnType}'`,
    );
  } else {
    if (columnType === "string") {
      query = query.whereILike(column.columnName, value);
    } else {
      query = query.where(column.columnName, value);
    }
    return query;
  }
}

function arrayTypeCheckHelper(
  values: (string | undefined)[],
  columnType: string,
) {
  let invalid: string[] = [];
  switch (columnType) {
    case "string": {
      break;
    }
    case "number": {
      invalid = values.filter(
        (value) => value !== undefined && Number.isNaN(Number(value)),
      ) as string[];
      break;
    }
    case "boolean": {
      invalid = values.filter(
        (value) =>
          value !== undefined &&
          value !== "true" &&
          value !== "1" &&
          value !== "false" &&
          value !== "0",
      ) as string[];
      break;
    }
    case "DateTime": {
      invalid = values.filter(
        (value) =>
          value !== undefined && !DateTime.fromJSDate(new Date(value)).isValid,
      ) as string[];
      break;
    }
    default: {
      throw new NotImplementedException(
        `Unsupported column type '${columnType}' in arrayTypeCheckHelper.`,
      );
    }
  }
  return invalid;
}

function extractType(column: ModelColumnOptions) {
  const columnDef: ColumnDef = column;
  const columnType = columnDef.meta?.type;
  if (columnType === undefined) {
    throw new ColumnTypeNotImplementedException(column.columnName);
  } else {
    return columnType;
  }
}
