import { QueryResult } from "pg";

import db from "@adonisjs/lucid/services/db";
import { LucidModel } from "@adonisjs/lucid/types/model";

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
  sequenceName ??= `${table}_${column}_seq`;

  const result = await db.rawQuery<QueryResult<{ next_val: string }>>(
    "SELECT setval(?, GREATEST(nextval(?), (SELECT MAX(??)+1 FROM ??)), FALSE) AS next_val",
    [sequenceName, sequenceName, column, table],
  );
  const nextVal = result.rows[0].next_val;
  return BigInt(nextVal);
}

/**
 * Returns the amount of rows for a given model.
 *
 * Created because model.query().count() is a useless piece of crap, with bad TS typings.
 * @param model a lucidjs model
 * @returns the number of rows for a given model
 */
export async function modelCount(model: LucidModel): Promise<number> {
  const res = (await model.query().knexQuery.count()) as [{ count: string }];
  return Number.parseInt(res[0].count);
}

/**
 * Normalizes the "order" field by replacing it with a fresh integer sequence
 *
 * Relative order of the rows is unchanged.
 * @param table name of the table to normalize
 */
export async function normalizeOrderField(table: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.rawQuery(
      `
      -- create temp table
      CREATE TEMPORARY TABLE IF NOT EXISTS "temp_normalize_order" (
        id INTEGER PRIMARY KEY,
        new_order SERIAL
      )
      ON COMMIT DROP;
      TRUNCATE TABLE "temp_normalize_order";

      -- populate it with ids of the target table (ordered by current order)
      -- this will generate the new order values
      INSERT INTO "temp_normalize_order" (id)
      SELECT "id" FROM ??
      ORDER BY "order" ASC, "id" ASC;

      -- update target table
      UPDATE ?? AS "target"
      SET "order" = "tmp"."new_order"
      FROM "temp_normalize_order" AS "tmp"
      WHERE "target"."id" = "tmp"."id";
    `,
      [table, table],
    );
  });
}
