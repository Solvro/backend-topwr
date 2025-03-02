import { LucidResource } from "@adminjs/adonis";

import { linkTypeEnumsValues } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

import { readOnlyTimestamps } from "./utils/timestamps.js";

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
  },
};

const fieldsOfStudyResource = {
  resource: new LucidResource(FieldsOfStudy, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const departmentsResources = [
  departmentResource,
  departmentsLinkResource,
  fieldsOfStudyResource,
];
