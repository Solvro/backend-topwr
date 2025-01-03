import { DateTime } from "luxon";

import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import StudentOrganization from "#models/student_organization";

export default class StudentOrganizationTag extends BaseModel {
  @column({ isPrimary: true })
  declare tag: string;

  @manyToMany(() => StudentOrganization, {
    pivotTable: "student_organizations_student_organization_tags",
    localKey: "tag",
    pivotForeignKey: "tag",
    pivotRelatedForeignKey: "student_organization_id",
  })
  declare organizations: ManyToMany<typeof StudentOrganization>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
