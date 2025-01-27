import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { LinkType } from "#enums/link_type";
import Department from "#models/department";
import DepartmentsLink from "#models/department_link";
import FieldsOfStudy from "#models/field_of_study";

export default class extends BaseSeeder {
  static environment = ["development", "testing"];
  async run() {
    await Department.createMany([
      {
        name: "Wydział Architektury",
        addressLine1: "Politechnika Wrocławska ul. Bolesława Prusa 53/55",
        addressLine2: "50-317 Wrocław",
        code: "W1",
        betterCode: "WA",
        logo: null,
        description: "Wydział Architektury - Jakis opis",
        gradientStart: "#BFBEBE",
        gradientStop: "#868585",
      },
      {
        name: "Wydział Budownictwa Lądowego i Wodnego",
        addressLine1: "Politechnika Wrocławska pl. Grunwaldzki 11",
        addressLine2: "50-377 Wrocław",
        code: "W2",
        betterCode: "WBLIW",
        logo: null,
        description: "Wydział Budownictwa Lądowego i Wodnego - Jakis opis",
        gradientStart: "#CA6846",
        gradientStop: "#FFA07E",
      },
    ]);

    await DepartmentsLink.createMany([
      {
        departmentId: 1,
        linkType: LinkType.TopwrBuildings,
        link: "topwr:buildings/42",
      },
      {
        departmentId: 1,
        linkType: LinkType.Default,
        link: "http://wa.pwr.edu.pl",
      },
      {
        departmentId: 2,
        linkType: LinkType.TopwrBuildings,
        link: "topwr:buildings/28",
      },
      {
        departmentId: 2,
        linkType: LinkType.Default,
        link: "https://wbliw.pwr.edu.pl",
      },
    ]);

    await FieldsOfStudy.createMany([
      {
        departmentId: 1,
        name: "Architektura",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/architektura/",
        semesterCount: 8,
        isEnglish: false,
        is2ndDegree: false,
        hasWeekendOption: false,
      },
      {
        departmentId: 1,
        name: "Architektura w j. angielskim",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/architektura-w-j-angielskim/",
        semesterCount: 3,
        isEnglish: true,
        is2ndDegree: true,
        hasWeekendOption: false,
      },
      {
        departmentId: 2,
        name: "Budownictwo",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/budownictwo/",
        semesterCount: 5,
        isEnglish: false,
        is2ndDegree: false,
        hasWeekendOption: true,
      },
      {
        departmentId: 2,
        name: "Budownictwo",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/budownictwo-2/",
        semesterCount: 3,
        isEnglish: false,
        is2ndDegree: true,
        hasWeekendOption: true,
      },
    ]);
  }
}
