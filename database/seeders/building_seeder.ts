import { DateTime } from "luxon";

import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { ExternalDigitalGuideMode } from "#enums/digital_guide_mode";
import { Weekday } from "#enums/weekday";
import Building from "#models/building";
import Campus from "#models/campus";
import Library from "#models/library";

import { BuildingIcon } from "../../app/enums/building_icon.js";

export default class BuildingSeeder extends BaseSeeder {
  static environment = ["development", "testing"];

  async run() {
    const capmuses = await Campus.createMany([
      {
        name: "taki",
        coverKey: null,
      },
      {
        name: "siaki",
        coverKey: null,
      },
      {
        name: "i owaki",
        coverKey: null,
      },
    ]);

    const buildings = [
      {
        identifier: "B001",
        specialName: "Main Admin Building",
        iconType: BuildingIcon.Icon,
        addressLine1: "123 University Ave",
        addressLine2: "Building A",
        latitude: 40.7128,
        longitude: -74.006,
        haveFood: true,
        coverKey: null,
        externalDigitalGuideMode: ExternalDigitalGuideMode.WebUrl,
        externalDigitalGuideIdOrUrl:
          "https://dostepnosc.pwr.edu.pl/dostepnosc-architektoniczna/deklaracje-dostepnosci-budynkow/budynki-a/a2",
      },
      {
        identifier: "B002",
        specialName: "Engineering Block",
        iconType: BuildingIcon.Icon,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        latitude: 40.7129,
        longitude: -74.0061,
        haveFood: false,
        coverKey: null,
        externalDigitalGuideMode: ExternalDigitalGuideMode.DigitalGuideBuilding,
        externalDigitalGuideIdOrUrl: "5",
      },
      {
        identifier: "B003",
        specialName: null,
        iconType: BuildingIcon.Icon,
        addressLine1: "500 Science Park",
        addressLine2: "kolowe sny",
        latitude: 37.7749,
        longitude: -122.4194,
        haveFood: true,
        coverKey: null,
      },
    ];

    const updatedBuildings: Building[] = [];
    for (const [i, campus] of capmuses.entries()) {
      updatedBuildings[i] = await campus
        .related("buildings")
        .create(buildings[i]);
    }

    const libraries = await Library.createMany([
      {
        title: "Old library",
        room: "123",
        addressLine1: "123 University Ave",
        addressLine2: "Building A",
        phone: "673 872 568",
        email: "old.lib@mail.com",
        latitude: 40.7128,
        longitude: -74.006,
        photoKey: null,
      },
      {
        title: "New library",
        room: null,
        addressLine1: "500 Science Park",
        addressLine2: "Tower",
        phone: "962 871 902",
        email: "new.lib@mail.com",
        latitude: 48.1683,
        longitude: -217.072,
        photoKey: null,
      },
      {
        title: "Sun library",
        room: "62",
        addressLine1: "113 University Ave",
        addressLine2: "Building E",
        phone: "872 924 124",
        email: "sun.lib@mail.com",
        latitude: 37.7749,
        longitude: -122.4194,
        photoKey: null,
      },
    ]);

    const regularHours = [
      {
        weekDay: Weekday.Monday,
        openTime: "10:00",
        closeTime: "18:00",
      },
      {
        weekDay: Weekday.Tuesday,
        openTime: "10:00",
        closeTime: "17:00",
      },
      {
        weekDay: Weekday.Wednesday,
        openTime: "10:00",
        closeTime: "17:00",
      },
      {
        weekDay: Weekday.Thursday,
        openTime: "10:00",
        closeTime: "17:00",
      },
      {
        weekDay: Weekday.Friday,
        openTime: "09:00",
        closeTime: "16:00",
      },
    ];

    const specialHoursForEachLibrary = [
      {
        specialDate: DateTime.local(2023, 11, 15),
        openTime: "10:00",
        closeTime: "14:00",
      },
      {
        specialDate: DateTime.local(2023, 12, 19),
        openTime: "08:00",
        closeTime: "15:00",
      },
      {
        specialDate: DateTime.local(2024, 4, 5),
        openTime: "09:30",
        closeTime: "13:00",
      },
    ];

    const specialHoursObject = {
      specialDate: DateTime.local(2024, 4, 30),
      openTime: "10:00",
      closeTime: "15:30",
    };

    for (const library of libraries) {
      await library.related("regularHours").createMany(regularHours);

      await library
        .related("specialHours")
        .createMany(specialHoursForEachLibrary);
    }

    await libraries[0].related("specialHours").create(specialHoursObject);

    const aeds = [
      {
        latitude: 40.7812,
        longitude: -74.826,
        addressLine1: "123 University Ave",
        addressLine2: "Building A",
        photoKey: null,
      },
      {
        latitude: 40.7824,
        longitude: -74.2841,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        photoKey: null,
      },
      {
        latitude: 37.7292,
        longitude: -122.2924,
        addressLine1: "500 Science Park",
        addressLine2: "Tower",
        photoKey: null,
      },
    ];

    const bicycleShowers = [
      {
        room: "718",
        instructions: "Jhjhfansdmuicndjnvkncnadjvckj",
        latitude: 40.7812,
        longitude: -74.826,
        addressLine1: "123 University Ave",
        addressLine2: "Building A",
        photoKey: null,
      },
      {
        room: "219",
        instructions: "klojuhfasnfeukncjadskca",
        latitude: 40.7824,
        longitude: -74.2841,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        photoKey: null,
      },
    ];

    const foodSpot = {
      name: "Food spot 1",
      latitude: 40.7812,
      longitude: -74.826,
      addressLine1: "123 University Ave",
      addressLine2: "Building A",
      photoKey: null,
    };

    await updatedBuildings[0]
      .related("bicycleShowers")
      .create(bicycleShowers[0]);
    await updatedBuildings[1]
      .related("bicycleShowers")
      .create(bicycleShowers[1]);
    await updatedBuildings[0].related("foodSpots").create(foodSpot);

    for (const [i, building] of updatedBuildings.entries()) {
      await building.related("aeds").create(aeds[i]);
      await libraries[i].merge({ buildingId: building.id }).save();
    }
  }
}
