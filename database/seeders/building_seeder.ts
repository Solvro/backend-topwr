import { BaseSeeder } from "@adonisjs/lucid/seeders";

import Building from "#models/building";
import Campus from "#models/campus";

import { BuildingIcon } from "../../app/enums/building_icon.js";

export default class BuildingSeeder extends BaseSeeder {
  async run() {
    await Campus.createMany([
      {
        name: "taki",
        cover: "http://example.com",
      },
      {
        name: "siaki",
        cover: "http://example.com",
      },
      {
        name: "i owaki",
        cover: "http://example.com",
      },
    ]);
    await Building.createMany([
      {
        identifier: "B001",
        specialName: "Main Admin Building",
        iconType: BuildingIcon.Icon,
        campusId: 2,
        addressLine1: "123 University Ave",
        addressLine2: "Building A",
        latitude: 40.7128,
        longitude: -74.006,
        haveFood: true,
        cover: "https://example.com/covers/building1.jpg",
      },
      {
        identifier: "B002",
        specialName: "Engineering Block",
        iconType: BuildingIcon.Icon,
        campusId: 3,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        latitude: 40.7129,
        longitude: -74.0061,
        haveFood: false,
        cover: "https://example.com/covers/building2.jpg",
      },
      {
        identifier: "B003",
        specialName: null,
        iconType: BuildingIcon.Icon,
        campusId: 2,
        addressLine1: "500 Science Park",
        addressLine2: "kolowe sny",
        latitude: 37.7749,
        longitude: -122.4194,
        haveFood: true,
        cover: "https://example.com/covers/building3.jpg",
      },
    ]);
  }
}
