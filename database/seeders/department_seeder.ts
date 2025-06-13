import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { LinkType } from "#enums/link_type";
import { StudiesType } from "#enums/studies_type";
import Department from "#models/department";
import DepartmentLink from "#models/department_link";
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
        logoKey: null,
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
        logoKey: null,
        description: "Wydział Budownictwa Lądowego i Wodnego - Jakis opis",
        gradientStart: "#CA6846",
        gradientStop: "#FFA07E",
      },
    ]);

    await DepartmentLink.createMany([
      {
        departmentId: 1,
        linkType: LinkType.TopwrBuildings,
        name: "Link to B-42",
        link: "topwr:buildings/42",
      },
      {
        departmentId: 1,
        linkType: LinkType.Default,
        name: "Link to WA",
        link: "http://wa.pwr.edu.pl",
      },
      {
        departmentId: 2,
        linkType: LinkType.TopwrBuildings,
        name: "Link to B-28",
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
        studiesType: StudiesType.LongCycle,
        isEnglish: false,
        hasWeekendOption: false,
      },
      {
        departmentId: 1,
        name: "Architektura w j. angielskim",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/architektura-w-j-angielskim/",
        studiesType: StudiesType.SecondDegree,
        isEnglish: true,
        hasWeekendOption: false,
      },
      {
        departmentId: 2,
        name: "Budownictwo",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/budownictwo/",
        studiesType: StudiesType.FirstDegree,
        isEnglish: false,
        hasWeekendOption: true,
      },
      {
        departmentId: 2,
        name: "Budownictwo",
        url: "https://rekrutacja.pwr.edu.pl/wyszukiwarka-kierunkow-studiow/budownictwo-2/",
        studiesType: StudiesType.SecondDegree,
        isEnglish: false,
        hasWeekendOption: true,
      },
    ]);
  }
}
