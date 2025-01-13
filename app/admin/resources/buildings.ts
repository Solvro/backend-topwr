import { LucidResource } from "@adminjs/adonis";

import { BuildingIcon } from "#enums/building_icon";
import Aed from "#models/aed";
import BicycleShower from "#models/bicycle_shower";
import Building from "#models/building";
import Campus from "#models/campus";

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

export const aedResource = {
  resource: new LucidResource(Aed, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const bicycleShowerResource = {
  resource: new LucidResource(BicycleShower, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};
