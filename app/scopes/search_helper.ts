import { DateTime } from "luxon";

import logger from "@adonisjs/core/services/logger";
import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  ModelAttributes,
  ModelQueryBuilderContract,
  QueryScope,
} from "@adonisjs/lucid/types/model";

import { ValidatedColumnDef, validateColumnDef } from "#decorators/typed_model";
import { BadRequestException } from "#exceptions/http_exceptions";
import env from "#start/env";

/*
 *
 * Thanks to Dawid Linek for concept
 *
 */

export interface RangeSearch {
  param: string;
  isFrom: boolean;
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
 * @returns {LucidQueryScope<T>} - A Lucid query scope function.
 *
 * The returned scope function takes an object where:
 * - **keys** are model column name
 * - **values** are query string values of shape:
 * - - **string**
 * - - **string[]**
 * - - **<string>.to / <string>.from**
 *
 * Filtering request is validated based on column type defined in `meta` property of each column definition.
 * Column type needs to match the ColumnType type defined in **@typedModel** decorator
 *
 * **Supported Column Types:**
 * - **string**:   Direct match or pattern-based filtering.
 * - **number**:   Numeric comparisons (`=`, `>=`, `<=`) and range based filtering.
 * - **boolean**:  Matches `true`, `false`, `1`, or `0`.
 * - **DateTime**: Filters JS date/time values for exact or range-based filtering.
 * - **enum**:     Exact match only
 *
 * **Asumptions**
 * - invalid type input will result in BadRequest response
 * - not defined type on column will result in NotImplemented response (501)
 * - [from]/[to] filtering applies only to numeric or date columns
 * - empty string value for filtering param is ignored
 * - filtering param non existent in model columns is ignored
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
export function handleSearchQuery<T extends LucidModel>(): QueryScope<
  T,
  (
    query: ModelQueryBuilderContract<T>,
    qs: Record<string, string | string[] | undefined>,
    ...excluded: Partial<keyof ModelAttributes<InstanceType<T>>>[]
  ) => void
> {
  return scope((query, qs, ...excluded) => {
    for (const [queryParam, queryValue] of Object.entries(qs)) {
      const range = checkForRangeSearch(queryParam);
      const entry = extractEntry(
        range?.param ?? queryParam, //if range search detected pass the param without the range search suffix
        queryValue,
        excluded as string[],
        query.model,
      );
      if (entry === undefined) {
        continue;
      }

      const [column, value] = entry;
      if (Array.isArray(value)) {
        query = handleArray(query, column, value);
      } else {
        query =
          range !== undefined
            ? handleRange(query, column, value, range.isFrom)
            : handleDirectValue(query, column, value);
      }
    }
  });
}

function checkForRangeSearch(paramName: string): RangeSearch | undefined {
  if (paramName.endsWith(".from")) {
    return {
      param: paramName.substring(0, paramName.length - 5),
      isFrom: true,
    };
  } else if (paramName.endsWith(".to")) {
    return {
      param: paramName.substring(0, paramName.length - 3),
      isFrom: false,
    };
  }
  return undefined;
}

function handleArray<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ValidatedColumnDef,
  values: string[],
) {
  const columnType = column.meta.typing.declaredType;
  const invalid = arrayTypeCheckHelper(values, column);
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

function handleRange<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ValidatedColumnDef,
  value: string,
  isFrom: boolean,
) {
  const columnType = column.meta.typing.declaredType;
  if (columnType !== "number" && columnType !== "DateTime") {
    // [from]/[to] make sense only on number or date
    throw new BadRequestException(
      `Can't filter 'from'/'to' on types other than 'number'/'DateTime'. ` +
        `Type of '${column.columnName}' is '${columnType}'`,
    );
  } else {
    // verify using the same logic as for array of values
    const invalid = arrayTypeCheckHelper([value], column);
    if (invalid.length > 0) {
      const invalidMessage = isFrom ? `[from]=${value}` : `[to]=${value}`;
      throw new BadRequestException(
        `invalid filter value: ${invalidMessage} ;` +
          `for column: '${column.columnName}' ` +
          `of type: '${columnType}'`,
      );
    }
    if (columnType === "number") {
      if (isFrom) {
        query = query.where(column.columnName, ">=", Number(value));
      } else {
        query = query.where(column.columnName, "<=", Number(value));
      }
    } else {
      const date = new Date(value);
      if (isFrom) {
        query = query.where(column.columnName, ">=", date);
      } else {
        query = query.where(column.columnName, "<=", date);
      }
    }
  }
  return query;
}

function handleDirectValue<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ValidatedColumnDef,
  value: string,
) {
  const columnType = column.meta.typing.declaredType;
  const invalid = arrayTypeCheckHelper([value], column);
  if (invalid.length > 0) {
    const allowedValues =
      column.meta.typing.declaredType === "enum"
        ? `. allowed values for this column: ${column.meta.typing.allowedValues.join(", ")}`
        : "";
    throw new BadRequestException(
      `invalid filter value '${value}' ` +
        `for column: '${column.columnName}' ` +
        `of type: '${columnType}'${allowedValues}`,
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
  column: ValidatedColumnDef,
) {
  let invalid: string[] = [];
  switch (column.meta.typing.declaredType) {
    case "string": {
      break;
    }
    case "enum": {
      const allowedValues = column.meta.typing.allowedValues;
      invalid = values.filter(
        (value) => value !== undefined && !allowedValues.includes(value),
      ) as string[];
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
  }
  return invalid;
}

function extractEntry<T extends LucidModel>(
  param: string,
  value: string | string[] | undefined,
  excluded: string[],
  model: T,
): [ValidatedColumnDef, string | string[]] | undefined {
  const trimmed = param.trim();
  if (excluded.includes(trimmed) || trimmed === "") {
    return;
  }
  if (value === undefined || value === "") {
    // empty string values are ignored
    return;
  }
  // predicate for ts type safety
  const column = model.$getColumn(trimmed);
  if (column === undefined) {
    return;
  }
  if (validateColumnDef(column)) {
    return [column, value];
  }

  // DEVELOPMENT LOGGING
  const app = env.get("NODE_ENV");
  if (["development", "test"].includes(app)) {
    logger.warn(
      `\nColumn type for '${column.columnName}' not defined or not supported. \n` +
        `Check 'meta: declaredType' property in columnDefinitions. \n` +
        `Supported types are ["string", "number", "boolean", "DateTime", "enum"]. \n` +
        `Columns defined as "enum" must additonally include the 'meta: allowedValues' property.` +
        `Exclude explicitly unsupported types in the scope invoking level.`,
    );
  }
}
