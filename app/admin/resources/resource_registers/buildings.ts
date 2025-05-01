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

import { ResourceBuilder, normalizeResourceName } from "../resource_factory.js";

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
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(BicycleShower),
              joinKey: BicycleShower.getBuildingsRelationKey(),
            },
          },
        },
        {
          displayLabel: "Food spots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(FoodSpot),
              joinKey: FoodSpot.getBuildingsRelationKey(),
            },
          },
        },
        {
          displayLabel: "Libraries",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(Library),
              joinKey: Library.getBuildingsRelationKey(),
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
      isRelationTarget: true,
    },
    {
      forModel: Library,
      addImageHandlingForProperties: ["photoKey"],
      isRelationTarget: true,
      ownedRelations: [
        {
          displayLabel: "Regular hours",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(RegularHour),
              joinKey: RegularHour.getLibraryRelationKey(),
            },
          },
        },
        {
          displayLabel: "Special hours",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: normalizeResourceName(SpecialHour),
              joinKey: SpecialHour.getLibraryRelationKey(),
            },
          },
        },
      ],
    },
    { forModel: RegularHour, isRelationTarget: true },
    { forModel: SpecialHour, isRelationTarget: true },
  ],
  navigation,
};
