import { DateTime } from "luxon";

import { BaseModel, belongsTo, hasMany, manyToMany } from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
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

export default class StudentOrganization extends BaseModel {
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "integer", optional: true })
  declare departmentId: number | null;

  @typedColumn({ type: "uuid", optional: true })
  declare logoKey: string | null;

  @typedColumn({ type: "uuid", optional: true })
  declare coverKey: string | null;

  @typedColumn({ type: "string", optional: true })
  declare description: string | null;

  @typedColumn({ type: "string", optional: true })
  declare shortDescription: string | null;

  @typedColumn({ type: "boolean" })
  declare coverPreview: boolean;

  @typedColumn({ type: OrganizationSource })
  declare source: OrganizationSource;

  @typedColumn({ type: OrganizationType })
  declare organizationType: OrganizationType;

  @typedColumn({ type: OrganizationStatus })
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

  public static getTagRelationKey() {
    return "id";
  }

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  public static getDepartmentRelationKey() {
    return "departmentId";
  }

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

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static handleSearchQuery = handleSearchQuery(StudentOrganization);

  static handleSortQuery = handleSortQuery(StudentOrganization);

  static preloadRelations = preloadRelations(StudentOrganization);
}
