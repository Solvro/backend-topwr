import { DateTime } from "luxon";

import logger from "@adonisjs/core/services/logger";
import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  ModelAttributes,
  ModelColumnOptions,
  ModelQueryBuilderContract,
  QueryScope,
} from "@adonisjs/lucid/types/model";

import { BadRequestException } from "#exceptions/http_exceptions";
import env from "#start/env";

import { ColumnDef, ColumnType } from "../decorators/typed_model.js";

/*
 *
 * Thanks to Dawid Linek for concept
 *
 */

const types = new Set(["number", "string", "boolean", "DateTime", "enum"]);

export interface ColumnDefExplicit extends ModelColumnOptions {
  meta:
    | {
        declaredType: Exclude<ColumnType, "enum">;
      }
    | {
        declaredType: "enum";
        allowedValues: string[];
      };
}

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
 * - **string**:   Direct match or pattern-based filtering.
 * - **number**:   Numeric comparisons (`=`, `>=`, `<=`).
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
    qs: Record<string, string | string[] | FromTo | undefined>,
    ...excluded: Partial<keyof ModelAttributes<InstanceType<T>>>[]
  ) => void
> {
  return scope((query, qs, ...excluded) => {
    for (const [queryParam, queryValue] of Object.entries(qs)) {
      const entry = extractEntry(
        queryParam,
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
      } else if (typeof value === "object") {
        query = handleFromTo(query, column, value);
      } else {
        query = handleDirectValue(query, column, value);
      }
    }
  });
}

function handleArray<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ColumnDefExplicit,
  values: string[],
) {
  const columnType = column.meta.declaredType;
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

function handleFromTo<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ColumnDefExplicit,
  value: FromTo,
) {
  const columnType = column.meta.declaredType;
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
    const invalid = arrayTypeCheckHelper(values, column);
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

function handleDirectValue<T extends LucidModel>(
  query: ModelQueryBuilderContract<T>,
  column: ColumnDefExplicit,
  value: string,
) {
  const columnType = column.meta.declaredType;
  const invalid = arrayTypeCheckHelper([value], column);
  if (invalid.length > 0) {
    const allowedValues =
      column.meta.declaredType === "enum"
        ? `. allowed values for this column: ${column.meta.allowedValues.join(", ")}`
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
  column: ColumnDefExplicit,
) {
  let invalid: string[] = [];
  switch (column.meta.declaredType) {
    case "string": {
      break;
    }
    case "enum": {
      const allowedValues = column.meta.allowedValues;
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
  value: string | string[] | FromTo | undefined,
  excluded: string[],
  model: T,
): [ColumnDefExplicit, string | string[] | FromTo] | undefined {
  if (excluded.includes(param) || param.trim() === "") {
    return;
  }
  if (value === undefined || value === "") {
    // empty string values are ignored
    return;
  }
  // predicate for ts type safety
  const isTypeValid = (column: ColumnDef): column is ColumnDefExplicit => {
    return (
      column.meta?.declaredType !== undefined &&
      types.has(column.meta.declaredType) &&
      (column.meta.declaredType !== "enum" ||
        column.meta.allowedValues !== undefined)
    );
  };
  const column = model.$getColumn(param);
  if (column === undefined) {
    return;
  }
  if (isTypeValid(column)) {
    return [column, value];
  }

  // DEVELOPMENT LOGGING
  const app = env.get("NODE_ENV");
  if (["development", "testing"].includes(app)) {
    logger.warn(
      `\nColumn type for '${column.columnName}' not defined or not supported. \n` +
        `Check 'meta: declaredType' property in columnDefinitions. \n` +
        `Supported types are ["string", "number", "boolean", "DateTime", "enum"]. \n` +
        `Columns defined as "enum" must additonally include the 'meta: allowedValues' property.` +
        `Exclude explicitly unsupported types in the scope invoking level.`,
    );
  }
}
