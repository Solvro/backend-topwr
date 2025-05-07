import { buildingIconEnumsValues } from "#enums/building_icon";
import { externalDigitalGuideModeEnumsValues } from "#enums/digital_guide_mode";
import Aed from "#models/aed";
import BicycleShower from "#models/bicycle_shower";
import Building from "#models/building";
import Campus from "#models/campus";
import FoodSpot from "#models/food_spot";
import Library from "#models/library";
import RegularHour from "#models/regular_hour";
import SpecialHour from "#models/special_hour";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Buildings",
  icon: "Home",
};

export const BuildingsBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: Building,
      additionalProperties: {
        iconType: buildingIconEnumsValues,
        externalDigitalGuideMode: externalDigitalGuideModeEnumsValues,
      },
      addImageHandlingForProperties: ["coverKey"],
      ownedRelations: [
        {
          displayLabel: "Bicycle showers",
          relationDefinition: {
            targetModel: BicycleShower,
          },
        },
        {
          displayLabel: "Food spots",
          relationDefinition: {
            targetModel: FoodSpot,
          },
        },
        {
          displayLabel: "Libraries",
          relationDefinition: {
            targetModel: Library,
          },
        },
        {
          displayLabel: "Aeds",
          relationDefinition: {
            targetModel: Aed,
          },
        },
      ],
      targetedByModels: [
        {
          targetModel: Campus,
          targetModelPlural_camelCase: "campus",
        },
      ],
    },
    {
      forModel: Campus,
      addImageHandlingForProperties: ["coverKey"],
      ownedRelations: [
        {
          displayLabel: "Buildings",
          relationDefinition: {
            targetModel: Building,
          },
        },
      ],
    },
    {
      forModel: Aed,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
    },
    {
      forModel: BicycleShower,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
    },
    {
      forModel: FoodSpot,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
    },
    {
      forModel: Library,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
      ownedRelations: [
        {
          displayLabel: "Regular hours",
          relationDefinition: {
            targetModel: RegularHour,
          },
        },
        {
          displayLabel: "Special hours",
          relationDefinition: {
            targetModel: SpecialHour,
          },
        },
      ],
    },
    { forModel: RegularHour, isRelationTarget: true },
    { forModel: SpecialHour, isRelationTarget: true },
  ],
  navigation,
};
