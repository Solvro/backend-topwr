import { LucidResource } from "@adminjs/adonis";
import { ActionRequest } from "adminjs";

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
import {
  aedValidator,
  bicycleShowerValidator,
  buildingValidator,
  campusValidator,
  foodSpotValidator,
  libraryValidator,
  regularHourValidator,
  specialHourValidator,
} from "./validators/buildings.js";
import { validateResource } from "./validators/utils.js";

const navigation = {
  name: "Buildings",
  icon: "Home",
};

const buildingResource = {
  resource: new LucidResource(Building, "postgres"),
  options: {
    navigation,
    properties: {
      iconType: buildingIconEnumsValues,
      ...readOnlyTimestamps,
    },
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(buildingValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(buildingValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(campusValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(campusValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(aedValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(aedValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(bicycleShowerValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(bicycleShowerValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(foodSpotValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(foodSpotValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(libraryValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(libraryValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(regularHourValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(regularHourValidator, request),
      },
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
    actions: {
      new: {
        before: async (request: ActionRequest) =>
          await validateResource(specialHourValidator, request),
      },
      edit: {
        before: async (request: ActionRequest) =>
          await validateResource(specialHourValidator, request),
      },
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
