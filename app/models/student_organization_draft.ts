import { MorphMap } from "@holoyan/adonisjs-permissions";
import {
  AclModelInterface,
  ModelIdType,
} from "@holoyan/adonisjs-permissions/types";
import { DateTime } from "luxon";

import { BaseModel, belongsTo } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import { typedColumn } from "#decorators/typed_model";
import { OrganizationSource } from "#enums/organization_source";
import { OrganizationStatus } from "#enums/organization_status";
import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import StudentOrganization from "#models/student_organization";
import { preloadRelations } from "#scopes/preload_helper";
import { handleSearchQuery } from "#scopes/search_helper";
import { handleSortQuery } from "#scopes/sort_helper";

import FileEntry from "./file_entry.js";

@MorphMap("student_organization_drafts")
export default class StudentOrganizationDraft
  extends BaseModel
  implements AclModelInterface
{
  getModelId(): ModelIdType {
    return this.id;
  }
  @typedColumn({ isPrimary: true, type: "integer" })
  declare id: number;

  @typedColumn({ type: "string" })
  declare name: string;

  @typedColumn({ type: "boolean" })
  declare isStrategic: boolean;

  @typedColumn({ foreignKeyOf: () => Department, optional: true })
  declare departmentId: number | null;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
  declare logoKey: string | null;

  @typedColumn({ foreignKeyOf: () => FileEntry, optional: true })
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

  // Link to original published organization (optional)
  @typedColumn({ foreignKeyOf: () => StudentOrganization, optional: true })
  declare originalOrganizationId: number | null;

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>;

  @belongsTo(() => FileEntry, { localKey: "id", foreignKey: "logoKey" })
  declare logo: BelongsTo<typeof FileEntry>;

  @belongsTo(() => FileEntry, { localKey: "id", foreignKey: "coverKey" })
  declare cover: BelongsTo<typeof FileEntry>;

  @belongsTo(() => StudentOrganization, {
    localKey: "id",
    foreignKey: "originalOrganizationId",
  })
  declare originalOrganization: BelongsTo<typeof StudentOrganization>;

  @typedColumn.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @typedColumn.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  static preloadRelations = preloadRelations();
  static handleSearchQuery = handleSearchQuery();
  static handleSortQuery = handleSortQuery();
}
