import { QueryResult } from "pg";

import db from "@adonisjs/lucid/services/db";

/**
 * Advances the sequence for the given column to never conflict with existing rows.
 *
 * Use this function after inserting rows with values that would usually be auto-generated (via autoincrement)
 * @param table - the name of the table to fix
 * @param column - the name of the column to fix. defaults to 'id'
 * @param sequenceName - the name of the sequence to fix. defaults to the default sequence name for the given table/column combo
 * @returns the next sequence value
 */
export async function fixSequence(
  table: string,
  column = "id",
  sequenceName?: string,
): Promise<bigint> {
  if (sequenceName === undefined) {
    sequenceName = `${table}_${column}_seq`;
  }

  const result = await db.rawQuery<QueryResult<{ next_val: string }>>(
    "SELECT setval(?, GREATEST(nextval(?), (SELECT MAX(??)+1 FROM ??)), FALSE) AS next_val",
    [sequenceName, sequenceName, column, table],
  );
  const nextVal = result.rows[0].next_val;
  return BigInt(nextVal);
}
