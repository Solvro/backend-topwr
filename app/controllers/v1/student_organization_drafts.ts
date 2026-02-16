import { ModelAttributes } from "@adonisjs/lucid/types/model";

import StudentOrganization from "#models/student_organization";
import StudentOrganizationDraft from "#models/student_organization_draft";

import { GenericDraftController } from "./drafts.js";

export default class StudentOrganizationDraftsController extends GenericDraftController<
  typeof StudentOrganization,
  typeof StudentOrganizationDraft,
  ModelAttributes<StudentOrganization>,
  ModelAttributes<StudentOrganizationDraft>
> {
  protected readonly queryRelations = [
    "logo",
    "cover",
    "department",
    "original",
  ];
  protected readonly model = StudentOrganizationDraft;
  protected readonly approvedModel = StudentOrganization;
}
