import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { LinkType } from "#enums/link_type";
import StudentOrganization from "#models/student_organization";

export default class StudentOrganizationLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare link: string;

  @column()
  declare linkType: LinkType;

  @column()
  declare organizationId: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => StudentOrganization)
  declare organization: BelongsTo<typeof StudentOrganization>;
}
