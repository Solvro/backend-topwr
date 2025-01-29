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

const navigation = {
  name: "Buildings",
};

const buildingResource = {
  resource: new LucidResource(Building, "postgres"),
  options: {
    navigation,
    properties: {
      iconType: buildingIconEnumsValues,
      ...readOnlyTimestamps,
    },
  },
};

const campusResource = {
  resource: new LucidResource(Campus, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const aedResource = {
  resource: new LucidResource(Aed, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const bicycleShowerResource = {
  resource: new LucidResource(BicycleShower, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const foodSpotResource = {
  resource: new LucidResource(FoodSpot, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const libraryResource = {
  resource: new LucidResource(Library, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const regularHourResource = {
  resource: new LucidResource(RegularHour, "postgres"),
  options: {
    navigation,
    properties: {
      ...readOnlyTimestamps,
    },
  },
};

const specialHourResource = {
  resource: new LucidResource(SpecialHour, "postgres"),
  options: {
    navigation,
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
