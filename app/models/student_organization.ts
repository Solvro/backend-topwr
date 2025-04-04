import { DateTime } from "luxon";

import {
  BaseModel,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import { typedModel } from "#decorators/typed_model";
import { applyLinkTypeSorting } from "#enums/link_type";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";

@typedModel({
  id: "number",
  name: "string",
  departmentId: "number",
  logoKey: "string",
  coverKey: "string",
  description: "string",
  shortDescription: "string",
  coverPreview: "boolean",
  source: OrganizationSource,
  organizationType: OrganizationType,
  organizationStatus: OrganizationStatus,
  createdAt: "DateTime",
  updatedAt: "DateTime",
})
export default class StudentOrganization extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare departmentId: number | null;

  @column()
  declare logoKey: string | null;

  @column()
  declare coverKey: string | null;

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

  @column()
  declare organizationStatus: OrganizationStatus;

  @hasMany(() => StudentOrganizationLink, {
    onQuery: (query) => {
      return query.orderByRaw(applyLinkTypeSorting);
    },
  })
  declare links: HasMany<typeof StudentOrganizationLink>;

  @manyToMany(() => StudentOrganizationTag, {
    pivotTable: "student_organizations_student_organization_tags",
    localKey: "id",
    pivotForeignKey: "student_organization_id",
    relatedKey: "tag",
    pivotRelatedForeignKey: "tag",
    pivotTimestamps: true,
  })
  declare tags: ManyToMany<typeof StudentOrganizationTag>;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "logoKey",
  })
  declare logo: BelongsTo<typeof FileEntry>;

  @belongsTo(() => FileEntry, {
    localKey: "id",
    foreignKey: "coverKey",
  })
  declare cover: BelongsTo<typeof FileEntry>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static handleSearchQuery = handleSearchQuery(StudentOrganization);

  static handleSortQuery = handleSortQuery(StudentOrganization);

  static preloadRelations = preloadRelations(StudentOrganization);
}
