import { toIBaseError } from "@solvro/error-handling/base";
import {
  analyzeErrorStack,
  prepareReportForLogging,
} from "@solvro/error-handling/reporting";
import * as cheerio from "cheerio";
import Progress from "ts-progress";

import { mapToStudiesType } from "#app/enums/studies_type";
import { BaseScraperModule } from "#commands/db_scrape";
import type { TaskHandle } from "#commands/db_scrape";
import Department from "#models/department";
import FieldOfStudyModel from "#models/field_of_study";

type FieldOfStudyDetailKey = Exclude<keyof FieldOfStudyDetails, "url" | "name">;

const LABELS: Partial<Record<string, FieldOfStudyDetailKey>> = {
  "forma studiów": "studyForm",
  "czas trwania": "timeSpan",
  czesne: "priceForPolishCitizens",
  "język wykładowy": "language",
  miasto: "city",
  "profil kierunku": "fieldProfile",
  dyscyplina: "discipline",
};

interface FieldOfStudyBasic {
  url: string;
  name: string;
}

interface FieldOfStudyDetails extends FieldOfStudyBasic {
  department: string;
  studyForm: string;
  timeSpan: string;
  priceForPolishCitizens: string;
  priceForForeignCitizens: string;
  language: string;
  city: string;
  fieldProfile: string;
  discipline: string;
}

interface FieldOfStudyResponse {
  html: string;
}

export default class FieldsOfStudyScraper extends BaseScraperModule {
  static name = "Fields of study";
  static description = "Scrape fields of study";
  static taskTitle? = "Scrape fields of study";

  private readonly departmentSelector = "div.course-header__top a > span";
  private readonly dataWrapperSelector = ".course-data-bar__data-wrapper";
  private readonly url: string =
    "https://rekrutacja.pwr.edu.pl/wp-admin/admin-ajax.php";
  private readonly basicInit: RequestInit = {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      action: "getFilteredStudies",
    }),
    method: "POST",
  };
  private readonly firstDegreeStudyLevelParam = "s1";
  private readonly secondDegreeStudyLevelParam = "s2";
  private readonly shortendFirstDegreeTermSpan = 6;
  private readonly basicFirstDegreeTermSpan = 7;
  private readonly extendedFirstDegreeTermSpan = 8;

  private readonly firstDegreeTermSpans = [
    this.shortendFirstDegreeTermSpan,
    this.basicFirstDegreeTermSpan,
    this.extendedFirstDegreeTermSpan,
  ];
  private readonly basicLongCycleTermSpan = 10;
  private readonly extendedLongCycleTermSpan = 12;

  private readonly longCycleTermSpans = [
    this.basicLongCycleTermSpan,
    this.extendedLongCycleTermSpan,
  ];
  private readonly basicSecondDegreeTermSpan = 3;
  private readonly extendedSecondDegreeTermSpan = 4;
  private readonly secondDegreeTermSpans = [
    this.basicSecondDegreeTermSpan,
    this.extendedSecondDegreeTermSpan,
  ];
  private progressBar?: ReturnType<typeof Progress.create>;

  private extendInit(studyLevel: string): RequestInit {
    const body = new URLSearchParams(this.basicInit.body as URLSearchParams);
    body.append("s_level", studyLevel);

    return {
      ...this.basicInit,
      body,
    };
  }

  private async mapDetailsToModel(
    details: FieldOfStudyDetails,
  ): Promise<FieldOfStudyModel> {
    const fieldOfStudy = new FieldOfStudyModel();
    let department;
    if (details.name === "Lekarski") {
      department = await Department.findBy("name", "Wydział Medyczny"); // this is temporary fix for the fact that the department name is not present in the details for the field of study "Lekarski"
    } else {
      department = await Department.findBy("name", details.department);
    }
    if (department === null) {
      throw new Error(
        `Department "${details.department}" not found for field of study "${details.name}."`,
      );
    }

    fieldOfStudy.departmentId = department.id;
    fieldOfStudy.name = details.name;
    fieldOfStudy.url = details.url;
    fieldOfStudy.isEnglish = details.language === "angielski";

    const match = /\d+/.exec(details.timeSpan);
    if (match === null) {
      throw new Error(
        `Could not extract term span from: "${details.timeSpan}"`,
      );
    }
    const studyTermSpan = Number(match[0]);

    if (this.firstDegreeTermSpans.includes(studyTermSpan)) {
      fieldOfStudy.studiesType = mapToStudiesType(false, false);
    } else if (this.longCycleTermSpans.includes(studyTermSpan)) {
      fieldOfStudy.studiesType = mapToStudiesType(true, false);
    } else if (this.secondDegreeTermSpans.includes(studyTermSpan)) {
      fieldOfStudy.studiesType = mapToStudiesType(false, true);
    } else {
      throw new Error(
        `Field of study has unknown studies type. name=${details.name}, department=${details.department}, timeSpan=${details.timeSpan}, language=${details.language}.`,
      );
    }
    fieldOfStudy.hasWeekendOption =
      details.priceForPolishCitizens.includes("niestacjonarne");

    return fieldOfStudy;
  }

  private async fetchFieldsOfStudy(
    url: string,
    init: RequestInit,
  ): Promise<FieldOfStudyBasic[]> {
    const res: FieldOfStudyResponse = (await this.fetchJSON(
      url,
      "html with field of study data",
      init,
    )) as FieldOfStudyResponse;

    const $ = cheerio.load(res.html);

    const fieldsOfStudy = $.extract({
      details: [
        {
          selector: "div.col-12",
          value: {
            name: "h2",
            url: {
              selector: "a.study-card",
              value: "href",
            },
          },
        },
      ],
    });
    return fieldsOfStudy.details as unknown as FieldOfStudyBasic[];
  }

  private async scrapeFieldsOfStudy(fieldsOfStudies: FieldOfStudyBasic[]) {
    for (const basicField of fieldsOfStudies) {
      try {
        const field = basicField as FieldOfStudyDetails;
        const responseDetails = await fetch(field.url);
        const htmlDetails = await responseDetails.text();
        const detailPage = cheerio.load(htmlDetails);

        field.department = detailPage(this.departmentSelector).text().trim();

        for (const wrapper of detailPage(this.dataWrapperSelector).toArray()) {
          const label = detailPage(wrapper)
            .find("h3")
            .text()
            .trim()
            .toLocaleLowerCase("pl");
          const value = detailPage(wrapper).find("li").text().trim();
          const key = LABELS[label];

          if (key) {
            field[key] = value;
          }
        }

        let fieldOfStudy: FieldOfStudyModel;
        try {
          fieldOfStudy = await this.mapDetailsToModel(field);
        } catch (error) {
          const report = analyzeErrorStack(toIBaseError(error));
          this.logger.warning(
            `Failed to map the '${field.name}' field of study to database model. Write of this field to db skipped: ${prepareReportForLogging(report)}`,
          );
          continue;
        }

        const existingFieldOfStudy = await FieldOfStudyModel.findBy(
          "name",
          fieldOfStudy.name,
        );

        try {
          if (existingFieldOfStudy !== null) {
            existingFieldOfStudy.merge(fieldOfStudy.$attributes);
            await existingFieldOfStudy.save();
          } else {
            await fieldOfStudy.save();
          }
        } catch (error) {
          this.logger.warning(
            `Failed to write the '${fieldOfStudy.name}' field of study to database: '${error}'`,
          );
        }
      } finally {
        this.progressBar?.update();
      }
    }
  }
  async run(task: TaskHandle): Promise<string> {
    task.update("Starting fetching all fields of study");

    const firstDegreeStudies = await this.fetchFieldsOfStudy(
      this.url,
      this.extendInit(this.firstDegreeStudyLevelParam),
    );
    const secondDegreeStudies = await this.fetchFieldsOfStudy(
      this.url,
      this.extendInit(this.secondDegreeStudyLevelParam),
    );
    const totalStudiesAmount =
      firstDegreeStudies.length + secondDegreeStudies.length;
    this.progressBar = Progress.create({ total: totalStudiesAmount });

    await Promise.all([
      this.scrapeFieldsOfStudy(firstDegreeStudies),
      this.scrapeFieldsOfStudy(secondDegreeStudies),
    ]);
    this.progressBar.done();
    return "Done";
  }
}
