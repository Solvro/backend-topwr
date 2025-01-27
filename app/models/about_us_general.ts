import { DateTime } from "luxon";

import { BaseModel, column } from "@adonisjs/lucid/orm";

import { typedModel } from "#decorators/typed_model";

@typedModel({
  id: "number",
  description: "string",
  coverPhotoKey: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class AboutUsGeneral extends BaseModel {
  public static table = "about_us_general";

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare description: string;

  @column()
  declare coverPhotoKey: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
