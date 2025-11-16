import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { LinkType } from "#enums/link_type";
import StudentOrganization from "#models/student_organization";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

export default class StudentOrganizationLink extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare link: string;

  @typedColumn({ type: "string", optional: true })
  declare name: string | null;

  @typedColumn({ type: LinkType })
  declare linkType: LinkType;

  @typedColumn({ foreignKeyOf: () => StudentOrganization })
  declare studentOrganizationId: number;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => StudentOrganization)
  declare organization: BelongsTo<typeof StudentOrganization>;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
