import { LucidResource } from "@adminjs/adonis";

import { OrganizationType } from "#enums/organization_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const departmentResource = {
  resource: new LucidResource(Department, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const departmentsLinkResource = {
  resource: new LucidResource(DepartmentsLink, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const fieldsOfStudyResource = {
  resource: new LucidResource(FieldsOfStudy, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationResource = {
  resource: new LucidResource(StudentOrganization, "postgres"),
  options: {
    properties: {
      organizationType: {
        availableValues: [
          {
            value: OrganizationType.ScientificCircle,
            label: "Scientific Circle",
          },
          {
            value: OrganizationType.StudentOrganization,
            label: "Student Organization",
          },
          { value: OrganizationType.StudentMedium, label: "Student Medium" },
          { value: OrganizationType.CultureAgenda, label: "Culture Agenda" },
          { value: OrganizationType.StudentCouncil, label: "Student council" },
        ],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationLinkResource = {
  resource: new LucidResource(StudentOrganizationLink, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationTagResource = {
  resource: new LucidResource(StudentOrganizationTag, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
