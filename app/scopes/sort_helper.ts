import { scope } from "@adonisjs/lucid/orm";
import {
  LucidModel,
  ModelQueryBuilderContract,
  QueryScope,
} from "@adonisjs/lucid/types/model";

import { BadRequestException } from "#exceptions/http_exceptions";

/**
 * Thanks to Dawid Linek for concept
 */

/**
 * Based on sort string apply sorting.
 * The sort param consist of 2 parts: sort = `${part[0]}${part[1]}`
 *  - **part[0]** should be character +- determining sorting type.
 *  - **part[1]** points to specific model columns
 *
 * **Asumptions**
 * - sort value is either string or undefined
 * - no value will be ignored
 * - invalid value pattern will result in badRequest
 * - mismatch in columns will be ignored as in filtration
 *
 * @returns scope that takes unknown sort param and tries to parse it using regex rule
 */
export function handleSortQuery<T extends LucidModel>(): QueryScope<
  T,
  (query: ModelQueryBuilderContract<T>, sort: unknown) => void
> {
  return scope((query, sort) => {
    if (typeof sort !== "string") {
      // means no value provided
      return;
    }
    const match = /^([+\- ])(\w+)$/.exec(sort);
    if (match === null) {
      throw new BadRequestException(
        `Invalid sort param '${sort}' ` +
          `pattern should be ('+' || '-')(columnName)`,
      );
    }
    const prefix = match[1];
    const column = match[2];
    if (!query.model.$hasColumn(column)) {
      return;
    }
    query = query.orderBy(column, prefix === "-" ? "desc" : "asc");
    return query;
  });
}
