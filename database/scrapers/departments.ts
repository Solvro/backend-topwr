import { DateTime } from "luxon";
import { Readable } from "node:stream";

import { BaseScraperModule, TaskHandle } from "#commands/db_scrape";
import DepartmentModel from "#models/department";
import DepartmentLinkModel from "#models/department_link";
import FieldOfStudyModel from "#models/field_of_study";
import FilesService from "#services/files_service";
import { fixSequence } from "#utils/db";

interface SourceResponse<T> {
  data: T[];
}

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

  async run(task: TaskHandle) {
    task.update("Starting fetching all schema objects");

    const [departmentsData, fieldOfStudyData, departmentLinkData] =
      (await Promise.all(
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
      departmentsData.data.map(async (departmentEntry) => {
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
          throw new Error(
            `Response body is null for department ${departmentEntry.id} with asset id ${departmentEntry.logo}`,
          );
        }
        const logoFile = await FilesService.uploadStream(
          Readable.fromWeb(fileResponse.body),
          extension,
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
            logoKey: logoFile.id,
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
            is2ndDegree: data.is2ndDegree,
            semesterCount: data.isLongCycleStudies ? 12 : 7,
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
      "departments_links_id_seq",
    );
    task.update(
      `Department Links created, ID sequence updated to ${nextDlinksId}`,
    );
  }
}
