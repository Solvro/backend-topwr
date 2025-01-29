import { LucidResource } from "@adminjs/adonis";

import { linkTypeEnumsValues } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const departmentResource = {
  resource: new LucidResource(Department, "postgres"),
  options: {
    properties: {
      description: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
  },
};

const departmentsLinkResource = {
  resource: new LucidResource(DepartmentsLink, "postgres"),
  options: {
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const fieldsOfStudyResource = {
  resource: new LucidResource(FieldsOfStudy, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const studentOrganizationResource = {
  resource: new LucidResource(StudentOrganization, "postgres"),
  options: {
    properties: {
      description: {
        type: "richtext",
      },
      organizationType: organizationTypeEnumsValues,
      source: organizationSourceEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const studentOrganizationLinkResource = {
  resource: new LucidResource(StudentOrganizationLink, "postgres"),
  options: {
    properties: {
      type: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const studentOrganizationTagResource = {
  resource: new LucidResource(StudentOrganizationTag, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const departmentsResources = [
  departmentResource,
  departmentsLinkResource,
  fieldsOfStudyResource,
  studentOrganizationResource,
  studentOrganizationLinkResource,
  studentOrganizationTagResource,
];
