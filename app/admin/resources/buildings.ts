import { LucidResource } from "@adminjs/adonis";

import Building from "#models/building";
import Campus from "#models/campus";

import { BuildingIcon } from "../../enums/building_icon.js";
import { readOnlyTimestamps } from "./utils/timestamps.js";

export const buildingResource = {
  resource: new LucidResource(Building, "postgres"),
  options: {
    properties: {
      iconType: {
        availableValues: [{ value: BuildingIcon.Icon, label: "Icon" }],
      },
      ...readOnlyTimestamps,
    },
  },
};

export const campusResource = {
  resource: new LucidResource(Campus, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
