import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import { linkTypeEnumsValues } from "#enums/link_type";
import { organizationSourceEnumsValues } from "#enums/organization_source";
import { organizationTypeEnumsValues } from "#enums/organization_type";
import StudentOrganization from "#models/student_organization";
import StudentOrganizationLink from "#models/student_organization_link";
import StudentOrganizationTag from "#models/student_organization_tag";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import {
  studentOrganizationLinkValidator,
  studentOrganizationTagValidator,
  studentOrganizationValidator,
} from "./validators/student_organizations.js";
import { validateResource } from "./validators/utils.js";

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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(studentOrganizationValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(studentOrganizationLinkValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          validateResource(studentOrganizationTagValidator, request),
      },
    },
  },
};

export const studentOrganizationsResources = [
  studentOrganizationResource,
  studentOrganizationLinkResource,
  studentOrganizationTagResource,
];
