import { LucidResource } from "@adminjs/adonis";

import Department from "#models/department";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const departmentResource = {
  resource: new LucidResource(Department, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
