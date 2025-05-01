import { RelationType } from "@adminjs/relations";

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
          relationName: "Bicycle showers",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: BicycleShower.name,
              joinKey: BicycleShower.getBuildingsRelationKey(),
            },
          },
        },
      ],
    },
    {
      forModel: Campus,
      addImageHandlingForProperties: ["coverKey"],
    },
    {
      forModel: Aed,
      addImageHandlingForProperties: ["photoKey"],
    },
    {
      forModel: BicycleShower,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
    },
    {
      forModel: FoodSpot,
      addImageHandlingForProperties: ["photoKey"],
    },
    {
      forModel: Library,
      addImageHandlingForProperties: ["photoKey"],
    },
    { forModel: RegularHour },
    { forModel: SpecialHour },
  ],
  navigation,
};
