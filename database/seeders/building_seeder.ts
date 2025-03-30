import { DateTime } from "luxon";

import { BaseSeeder } from "@adonisjs/lucid/seeders";

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
        cover: "https://example.com/covers/building1.jpg",
        externalDigitalGuideMode: "web_url",
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
        cover: "https://example.com/covers/building2.jpg",
        externalDigitalGuideMode: "id",
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
        cover: "https://example.com/covers/building3.jpg",
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
        photoUrl: "https://photo1.com",
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
        photoUrl: "https://photo2.com",
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
        photoUrl: "https://photo3.com",
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
        photoUrl: "https://ex_photo.jpg",
      },
      {
        latitude: 40.7824,
        longitude: -74.2841,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        photoUrl: "https://fejiax_photo.jpg",
      },
      {
        latitude: 37.7292,
        longitude: -122.2924,
        addressLine1: "500 Science Park",
        addressLine2: "Tower",
        photoUrl: "https://skjkfj_photo.jpg",
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
        photoUrl: "https://yhads782jf_photo.jpg",
      },
      {
        room: "219",
        instructions: "klojuhfasnfeukncjadskca",
        latitude: 40.7824,
        longitude: -74.2841,
        addressLine1: "124 University Ave",
        addressLine2: "Building B",
        photoUrl: "https://agjhsf_photo.jpg",
      },
    ];

    const foodSpot = {
      name: "Food spot 1",
      latitude: 40.7812,
      longitude: -74.826,
      addressLine1: "123 University Ave",
      addressLine2: "Building A",
      photoUrl: "https://food_spot_photo1.jpg",
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
