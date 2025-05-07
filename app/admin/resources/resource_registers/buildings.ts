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
import {
  anyCaseToPlural_snake_case,
  getOneToManyRelationForeignKey,
} from "#utils/model_utils";

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
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(BicycleShower),
              joinKey: getOneToManyRelationForeignKey(Building, "test"),
            },
          },
        },
        {
          displayLabel: "Food spots",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(FoodSpot),
              joinKey: getOneToManyRelationForeignKey(Building, "test"),
            },
          },
        },
        {
          displayLabel: "Libraries",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(Library),
              joinKey: getOneToManyRelationForeignKey(Building, "test"),
            },
          },
        },
        {
          displayLabel: "Aeds",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(Aed),
              joinKey: getOneToManyRelationForeignKey(Building, "test"),
            },
          },
        },
      ],
      isRelationTarget: true,
    },
    {
      forModel: Campus,
      addImageHandlingForProperties: ["coverKey"],
      ownedRelations: [
        {
          displayLabel: "Buildings",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(Building),
              joinKey: Building.getCampusRelationKey(),
            },
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
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(RegularHour),
              joinKey: RegularHour.getLibraryRelationKey(),
            },
          },
        },
        {
          displayLabel: "Special hours",
          relation: {
            type: RelationType.OneToMany,
            target: {
              resourceId: anyCaseToPlural_snake_case(SpecialHour),
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
