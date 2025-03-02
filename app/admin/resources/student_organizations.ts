import { LucidResource } from "@adminjs/adonis";

import { linkTypeEnumsValues } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const navigation = {
  name: "Student Organizations",
  icon: "Cpu",
};

const studentOrganizationResource = {
  resource: new LucidResource(StudentOrganization, "postgres"),
  options: {
    navigation,
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
    navigation,
    properties: {
      type: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const studentOrganizationTagResource = {
  resource: new LucidResource(StudentOrganizationTag, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const studentOrganizationsResources = [
  studentOrganizationResource,
  studentOrganizationLinkResource,
  studentOrganizationTagResource,
];
