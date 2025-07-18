import { DateTime } from "luxon";

import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
} from "#commands/db_scrape";
import { mapToStudiesType } from "#enums/studies_type";
import DepartmentModel from "#models/department";
import DepartmentLinkModel from "#models/department_link";
import FieldOfStudyModel from "#models/field_of_study";
import { fixSequence } from "#utils/db";

interface DepartmentsDraft {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  code: string;
  gradient_start: string;
  gradient_end: string;
  address: string;
  betterCode: string;
}

interface FieldOfStudyDraft {
  id: number;
  department_id: number | null;
  name: string;
  url: string | null;
  isEnglish: boolean;
  is2ndDegree: boolean;
  isLongCycleStudies: boolean;
  hasWeekendModeOption: boolean;
}

interface DepartmentLinkDraft {
  id: number;
  department_id: number | null;
  linkType: string;
  link: string;
  name: string;
}

export default class DepartmentsScraper extends BaseScraperModule {
  static name = "Departments";
  static description =
    "Scrapes pwr departments, field of study and departments links data from directus";
  static taskTitle = "Scrape departments, field of study and departments links";

  private readonly directusSchemas = [
    "Departments",
    "FieldOfStudy",
    "Departments_Links",
  ];
  private readonly addressRegex =
    /\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+$/;

  async shouldRun(): Promise<boolean> {
    return await this.modelHasNoRows(DepartmentModel, FieldOfStudyModel);
  }

  async run(task: TaskHandle) {
    task.update("Starting fetching all schema objects");

    const [departmentsData, fieldOfStudyData, departmentLinkData] =
      (await Promise.all(
        this.directusSchemas.map((schema) =>
          this.semaphore.runTask(() =>
            this.fetchDirectusJSON(
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
      departmentsData.data.map(async (departmentEntry) => {
        // Logo
        if (departmentEntry.logo === null) {
          throw new Error(
            `Logo for departmentEntry ${departmentEntry.id} is null - field is not nullable`,
          );
        }
        const fileId = await this.directusUploadFieldAndGetKey(
          departmentEntry.logo,
        );
        // Address
        const match = this.addressRegex.exec(departmentEntry.address);
        if (match !== null) {
          const postalCodeAndCity = match[0];
          const addressLine1 = departmentEntry.address
            .replace(this.addressRegex, "")
            .trim();
          const addressLine2 = postalCodeAndCity;
          return {
            id: departmentEntry.id,
            name: departmentEntry.name,
            addressLine1,
            addressLine2,
            code: departmentEntry.code,
            betterCode: departmentEntry.betterCode,
            isBranch: false,
            logoKey: fileId,
            description: departmentEntry.description,
            gradientStart: departmentEntry.gradient_start,
            gradientStop: departmentEntry.gradient_end,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          };
        } else {
          this.logger.warning(
            `Skipped record ${departmentEntry.id} because ${departmentEntry.address} doesn't match regex.`,
          );
          return undefined;
        }
      }),
    );

    await DepartmentModel.createMany(
      departmentEntries.filter((entry) => entry !== undefined),
    );
    const nextDepartmentId = await fixSequence("departments");
    task.update(
      `Departments created, ID sequence updated to ${nextDepartmentId}`,
    );

    await FieldOfStudyModel.createMany(
      fieldOfStudyData.data.flatMap((data) => {
        if (data.department_id === null) {
          this.logger.warning(
            `Skipped field of study entry ${data.id} due to missing department_id.`,
          );
          return [];
        }
        return [
          {
            id: data.id,
            departmentId: data.department_id,
            name: data.name,
            url: data.url,
            isEnglish: data.isEnglish,
            studiesType: mapToStudiesType(
              data.isLongCycleStudies,
              data.is2ndDegree,
            ),
            hasWeekendOption: data.hasWeekendModeOption,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          },
        ];
      }),
    );
    const nextFosId = await fixSequence("fields_of_studies");
    task.update(`Fields of Study created, ID sequence updated to ${nextFosId}`);

    await DepartmentLinkModel.createMany(
      departmentLinkData.data.flatMap((linkEntry) => {
        if (linkEntry.department_id === null) {
          this.logger.warning(
            `Skipped link entry ${linkEntry.id} due to missing department_id.`,
          );
          return [];
        }
        return [
          {
            id: linkEntry.id,
            departmentId: linkEntry.department_id,
            linkType: this.detectLinkType(linkEntry.link),
            link: linkEntry.link,
            name: linkEntry.name,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          },
        ];
      }),
    );
    const nextDlinksId = await fixSequence(
      "department_links",
      undefined,
      "departments_links_id_seq", //Do not change that to 'department_links_id_seq'
    );
    task.update(
      `Department Links created, ID sequence updated to ${nextDlinksId}`,
    );
  }
}
