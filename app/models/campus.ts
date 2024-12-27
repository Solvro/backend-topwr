import { DateTime } from "luxon";

import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";

import { typedModel } from "../decorators/typed_model.js";
import { preloadRelations } from "../scopes/preload_helper.js";
import { handleSearchQuery } from "../scopes/search_helper.js";
import { handleSortQuery } from "../scopes/sort_helper.js";
import Building from "./building.js";

@typedModel({
  id: "number",
  name: "string",
  cover: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class Campus extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare cover: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @hasMany(() => Building)
  declare buildings: HasMany<typeof Building>;

  static includeRelations = preloadRelations(Campus);

  static handleSearchQuery = handleSearchQuery(Campus);

  static handleSortQuery = handleSortQuery(Campus);
}
