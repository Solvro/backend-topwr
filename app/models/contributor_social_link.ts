import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { LinkType } from "#enums/link_type";

import Contributor from "./contributor.js";

export default class ContributorSocialLink extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "integer" })
  declare contributorId: number;

  @typedColumn({ type: LinkType })
  declare linkType: LinkType;

  @typedColumn({ type: "string" })
  declare link: string;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Contributor)
  declare contributor: BelongsTo<typeof Contributor>;
}
