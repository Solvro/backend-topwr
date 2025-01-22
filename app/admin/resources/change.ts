import { LucidResource } from "@adminjs/adonis";

import { ChangeType } from "#enums/change_type";
import Change from "#models/change";
import ChangeScreenshot from "#models/change_screenshot";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const changeResource = {
  resource: new LucidResource(Change, "postgres"),
  options: {
    properties: {
      type: {
        availableValues: [
          { value: ChangeType.Fix, label: "Fix" },
          { value: ChangeType.Feature, label: "Feature" },
        ],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const changeScreenshotResource = {
  resource: new LucidResource(ChangeScreenshot, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
