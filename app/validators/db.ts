import vine, { BaseType, Vine } from "@vinejs/vine";
import { FieldContext, SchemaTypes } from "@vinejs/vine/types";

import db from "@adonisjs/lucid/services/db";
import { LucidModel } from "@adonisjs/lucid/types/model";

import { InvalidModelDefinition } from "#exceptions/model_autogen_errors";
import { AutogenCacheEntry } from "#utils/model_autogen";

interface ForeignKeyOptions {
  table: string;
  column: string;
  modelName: string;
}

async function foreignKeyRule(
  value: unknown,
  options: ForeignKeyOptions,
  field: FieldContext,
) {
  if (!field.isValid) {
    return;
  }

  if (!(typeof value === "number" || typeof value === "string")) {
    return;
  }

  const res = (await db
    .knexQuery()
    .select(db.knexRawQuery("1"))
    .from(options.table)
    .where(options.column, value)
    .limit(1, { skipBinding: true })) as unknown[];

  if (res.length === 0) {
    field.report(
      `Invalid {{field}} value: ${options.modelName} with '${options.column}' = '${value}' does not exist`,
      "foreignKey",
      field,
    );
  }
}

const foreignKeyVineRule = vine.createRule(foreignKeyRule);

declare module "@vinejs/vine" {
  interface Vine {
    foreignKey(model: LucidModel): SchemaTypes;
  }
}

Vine.macro("foreignKey", (model: LucidModel) => {
  if (!model.booted) {
    model.boot();
  }
  const autogen = AutogenCacheEntry.for(model);
  const validator = autogen.primaryKeyField.columnOptions.meta.typing.validator;
  if (!("use" in validator && typeof validator.use === "function")) {
    throw new InvalidModelDefinition(
      `Model ${model.name}'s primary key validator does not have a use function???? (it should've been a VineNumber or a VineString anyway)`,
    );
  }
  return (validator.use as BaseType<unknown, unknown, unknown>["use"])(
    foreignKeyVineRule({
      table: model.table,
      column: autogen.primaryKeyField.columnOptions.columnName,
      modelName: model.name,
    }),
  );
});
