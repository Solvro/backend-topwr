import { LucidResource } from "@adminjs/adonis";

import { buildingIconEnumsValues } from "#enums/building_icon";
import Aed from "#models/aed";
import BicycleShower from "#models/bicycle_shower";
import Building from "#models/building";
import Campus from "#models/campus";
import FoodSpot from "#models/food_spot";
import Library from "#models/library";
import RegularHour from "#models/regular_hour";
import SpecialHour from "#models/special_hour";

import { readOnlyTimestamps } from "./utils/timestamps.js";

const buildingResource = {
  resource: new LucidResource(Building, "postgres"),
  options: {
    properties: {
      iconType: buildingIconEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const campusResource = {
  resource: new LucidResource(Campus, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const aedResource = {
  resource: new LucidResource(Aed, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const bicycleShowerResource = {
  resource: new LucidResource(BicycleShower, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const foodSpotResource = {
  resource: new LucidResource(FoodSpot, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const libraryResource = {
  resource: new LucidResource(Library, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const regularHourResource = {
  resource: new LucidResource(RegularHour, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const specialHourResource = {
  resource: new LucidResource(SpecialHour, "postgres"),
  options: {
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

export const buildingsResources = [
  buildingResource,
  campusResource,
  aedResource,
  bicycleShowerResource,
  foodSpotResource,
  libraryResource,
  regularHourResource,
  specialHourResource,
];
