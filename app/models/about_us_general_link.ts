import { DateTime } from "luxon";

import { BaseModel, column } from "@adonisjs/lucid/orm";

import { typedModel } from "#decorators/typed_model";
import { LinkType } from "#enums/link_type";

@typedModel({
  id: "number",
  linkType: LinkType,
  link: "string",
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class AboutUsGeneralLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare linkType: LinkType;

  @column()
  declare link: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
