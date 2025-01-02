import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import { OrganizationSource } from "#enums/organization_source";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";

export default class StudentOrganization extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare departmentId: number;

  @column()
  declare logo: string | null;

  @column()
  declare cover: string | null;

  @column()
  declare description: string | null;

  @column()
  declare shortDescription: string | null;

  @column()
  declare coverPreview: boolean;

  @column()
  declare source: OrganizationSource;

  @column()
  declare organizationType: OrganizationType;

  @hasMany(() => StudentOrganizationLink)
  declare links: HasMany<typeof StudentOrganizationLink>;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
