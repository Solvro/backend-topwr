import { LucidResource } from "@adminjs/adonis";

import Change from "#models/change";
import ChangeScreenshot from "#models/change_screenshot";

import { readOnlyTimestamps } from "./utils/timestamps.js";

export const changeResource = {
  resource: new LucidResource(Change, "postgres"),
  options: {
    properties: {
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
