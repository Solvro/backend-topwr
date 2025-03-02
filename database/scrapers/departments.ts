import { DateTime } from "luxon";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import { detectLinkType } from "#enums/link_type";
import DepartmentModel from "#models/department";
import DepartmentLinkModel from "#models/department_link";
import FieldOfStudyModel from "#models/field_of_study";
import FilesService from "#services/files_service";

interface SourceResponse<T> {
  data: T[];
}

interface DepartmentsDraft {
  id: number;
  name: string;
  logo: string;
  description: string;
  code: string;
  gradient_start: string;
  gradient_end: string;
  address: string;
  betterCode: string;
  createdAt: string;
  updatedAt: string;
}

interface FieldOfStudyDraft {
  id: number;
  department_id: number;
  name: string;
  url: string;
  isEnglish: boolean;
  is2ndDegree: boolean;
  isLongCycleStudies: boolean;
  hasWeekendModeOption: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentLinkDraft {
  id: number;
  department_id: number;
  linkType: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export default class DepartmentsScraper extends BaseScraperModule {
  static name = "Departments";
  static description =
    "Scrapes pwr departments, field of study and departments links data from directus";
  static taskTitle = "Scrape departments, field of study and departments links";

  private filesService = new FilesService();

  private readonly directusSchemas = [
    "Departments",
    "FieldOfStudy",
    "Departments_Links",
  ];

  async run(task: TaskHandle) {
    task.update("Starting fetching all schema objects");

    const [Departments, FieldOfStudy, DepartmentLink] = (await Promise.all(
      this.directusSchemas.map((schema) =>
        this.semaphore.runTask(() =>
          this.fetchJSON(
            `https://admin.topwr.solvro.pl/items/${schema}?limit=-1`,
            schema,
          ),
        ),
      ),
    )) as [
      SourceResponse<DepartmentsDraft>,
      SourceResponse<FieldOfStudyDraft>,
      SourceResponse<DepartmentLinkDraft>,
    ];

    const departmentEntries = await Promise.all(
      Departments.data.map(async (departmentEntry) => {
        // Logo
        const details = (await this.fetchJSON(
          `https://admin.topwr.solvro.pl/files/${departmentEntry.logo}?fields=filename_disk`,
          `details for file ${departmentEntry.logo}`,
        )) as { data: { filename_disk: string } };
        const extension = details.data.filename_disk
          .split(".")
          .pop()
          ?.toLowerCase();

        const fileResponse = await this.fetchAndCheckStatus(
          `https://admin.topwr.solvro.pl/assets/${departmentEntry.logo}`,
          `file ${departmentEntry.logo}`,
        );

        if (fileResponse.body === null) {
          throw new Error("Response body is null");
        }
        const name = await this.filesService.uploadStream(
          Readable.fromWeb(fileResponse.body),
          extension,
        );

        // Address
        const regex = /\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+$/;
        const match = departmentEntry.address.match(regex);
        if (match) {
          const postalCodeAndCity = match[0];
          const addressLine1 = departmentEntry.address
            .replace(regex, "")
            .trim();
          const addressLine2 = postalCodeAndCity;
          return {
            id: departmentEntry.id,
            name: departmentEntry.name,
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            code: departmentEntry.code,
            betterCode: departmentEntry.betterCode,
            logo: name,
            description: departmentEntry.description,
            gradientStart: departmentEntry.gradient_start,
            gradientStop: departmentEntry.gradient_end,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          };
        }
        return undefined;
      }),
    );

    await DepartmentModel.createMany(
      departmentEntries.filter((entry) => entry !== undefined),
    );
    task.update("Departments created!");

    const formattedFieldsOfStudies = await Promise.all(
      FieldOfStudy.data.map(async (data) => {
        return {
          id: data.id,
          departmentId: data.department_id,
          name: data.name,
          url: data.url,
          isEnglish: data.isEnglish,
          is2ndDegree: data.is2ndDegree,
          semesterCount: data.isLongCycleStudies ? 12 : 7,
          hasWeekendOption: data.hasWeekendModeOption,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        };
      }),
    );

    await FieldOfStudyModel.createMany(formattedFieldsOfStudies);
    task.update("Fields of Studies created!");

    await DepartmentLinkModel.createMany(
      DepartmentLink.data
        .filter((linkEntry) => linkEntry.department_id !== null)
        .map((linkEntry) => {
          return {
            id: linkEntry.id,
            departmentId: linkEntry.department_id,
            linkType: detectLinkType(linkEntry.link).type,
            link: linkEntry.link,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          };
        }),
    );
    task.update("Department Links created!");
  }
}
