import { buildingIconEnumsValues } from "#enums/building_icon";
import Aed from "#models/aed";
import BicycleShower from "#models/bicycle_shower";
import Building from "#models/building";
import Campus from "#models/campus";
import FoodSpot from "#models/food_spot";
import Library from "#models/library";
import RegularHour from "#models/regular_hour";
import SpecialHour from "#models/special_hour";

import { ResourceBuilder, ResourceInfo } from "../resource_factory.js";

const navigation = {
  name: "Buildings",
  icon: "Home",
};

export function setUpBuildings(): ResourceBuilder {
  const info: ResourceInfo[] = [
    {
      forModel: Building,
      additionalProperties: { iconType: buildingIconEnumsValues },
      addImageHandling: true,
    },
    { forModel: Campus, addImageHandling: true },
    { forModel: Aed },
    { forModel: BicycleShower },
    { forModel: FoodSpot },
    { forModel: Library },
    { forModel: RegularHour },
    { forModel: SpecialHour },
  ];
  return {
    navigation,
    builders: info,
  };
}
