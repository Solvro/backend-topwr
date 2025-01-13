import { LucidResource } from "@adminjs/adonis";

import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

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
