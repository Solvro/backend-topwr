import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import { BaseModel, computed } from "@adonisjs/lucid/orm";

import { typedColumn } from "#decorators/typed_model";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

const HEX_COLOR_REGEX = /^#[\da-f]{6}(?:[\da-f]{2})?$/;

export default class Banner extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string", optional: false })
  declare title: string;

  @typedColumn({ type: "string", optional: false })
  declare description: string;

  @typedColumn({
    type: "string",
    optional: true,
    validator: vine
      .string()
      .url({ protocols: ["https"], require_protocol: true })
      .nullable()
      .optional(),
  })
  declare url: string | null;

  @typedColumn({ type: "boolean", optional: false })
  declare draft: boolean;

  @typedColumn({
    type: "string",
    optional: true,
    validator: vine
      .string()
      .toLowerCase()
      .regex(HEX_COLOR_REGEX)
      .nullable()
      .optional(),
  })
  declare textColor: string | null;

  @typedColumn({
    type: "string",
    optional: true,
    validator: vine
      .string()
      .toLowerCase()
      .regex(HEX_COLOR_REGEX)
      .nullable()
      .optional(),
  })
  declare backgroundColor: string | null;

  @typedColumn({
    type: "string",
    optional: true,
    validator: vine
      .string()
      .toLowerCase()
      .regex(HEX_COLOR_REGEX)
      .nullable()
      .optional(),
  })
  declare titleColor: string | null;

  @typedColumn.dateTime({ optional: true })
  declare visibleFrom: DateTime | null;

  @typedColumn.dateTime({ optional: true })
  declare visibleUntil: DateTime | null;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @computed()
  get shouldRender(): boolean {
    const now = DateTime.now();
    return (
      !this.draft &&
      (this.visibleFrom === null || this.visibleFrom <= now) &&
      (this.visibleUntil === null || now <= this.visibleUntil)
    );
  }

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
