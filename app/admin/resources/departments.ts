import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

import { linkTypeEnumsValues } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { readOnlyTimestamps } from "./utils/timestamps.js";
import {
  departmentLinkValidator,
  departmentValidator,
  fieldsOfStudyValidator,
} from "./validators/departments.js";
import { validateResource } from "./validators/utils.js";

const navigation = {
  name: "Departments",
  icon: "Book",
};

const departmentResource = {
  resource: new LucidResource(Department, "postgres"),
  options: {
    navigation,
    properties: {
      description: {
        type: "richtext",
      },
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(departmentValidator, request),
      },
    },
  },
};

const departmentsLinkResource = {
  resource: new LucidResource(DepartmentsLink, "postgres"),
  options: {
    navigation,
    properties: {
      linkType: linkTypeEnumsValues,
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(departmentLinkValidator, request),
      },
    },
  },
};

const fieldsOfStudyResource = {
  resource: new LucidResource(FieldsOfStudy, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(fieldsOfStudyValidator, request),
      },
    },
  },
};

export const departmentsResources = [
  departmentResource,
  departmentsLinkResource,
  fieldsOfStudyResource,
];
